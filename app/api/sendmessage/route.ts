import crypto from "crypto";
import { MongoServerSelectionError, type Db } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import getMongoClient from "../../lib/mongodb";

export const runtime = "nodejs"; // MongoDB driver needs Node runtime

const RATE_LIMIT_COLLECTION = "rate_limit_counters";
const RATE_LIMIT_SCOPE = "sendmessage";
const DEFAULT_RATE_LIMIT_SECONDS = 60;
const RATE_LIMIT_SECONDS = getRateLimitSecondsFromEnv();
const RATE_LIMIT_WINDOW_MS = RATE_LIMIT_SECONDS * 1_000;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 1;
const RATE_LIMIT_MAX_REQUESTS = getRateLimitMaxRequestsFromEnv();

type RateLimitCounter = {
  _id: string;
  scope: string;
  ipHash: string;
  count: number;
  createdAt: Date;
  expiresAt: Date;
};

let rateLimitIndexesPromise: Promise<void> | undefined;

const BodySchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(254),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+855\d{6,12}$/, "Phone number must be a Cambodia (+855) number"),
});

function getClientIp(req: Request) {
  // Works behind most proxies/CDNs
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const ip =
    xff.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return ip;
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function getRateLimitSecondsFromEnv() {
  const value = Number(process.env.RATE_LIMIT);
  if (!Number.isFinite(value)) return DEFAULT_RATE_LIMIT_SECONDS;
  if (value <= 0) return DEFAULT_RATE_LIMIT_SECONDS;
  return Math.floor(value);
}

function getRateLimitMaxRequestsFromEnv() {
  const value = Number(process.env.RATE_LIMIT_MAX_REQUESTS);
  if (!Number.isFinite(value)) return DEFAULT_RATE_LIMIT_MAX_REQUESTS;
  if (value <= 0) return DEFAULT_RATE_LIMIT_MAX_REQUESTS;
  return Math.floor(value);
}

function getRateLimitCounterId(ipHash: string) {
  return `${RATE_LIMIT_SCOPE}:${ipHash}`;
}

async function ensureRateLimitIndexes(db: Db) {
  if (!rateLimitIndexesPromise) {
    rateLimitIndexesPromise = db
      .collection<RateLimitCounter>(RATE_LIMIT_COLLECTION)
      .createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: "expiresAtTTL" },
      )
      .then(() => undefined)
      .catch((error) => {
        rateLimitIndexesPromise = undefined;
        throw error;
      });
  }
  return rateLimitIndexesPromise;
}

async function consumeIpRateLimit(db: Db, ipHash: string) {
  const nowMs = Date.now();
  const nowDate = new Date(nowMs);
  const expiresAtDate = new Date(nowMs + RATE_LIMIT_WINDOW_MS);

  const counters = db.collection<RateLimitCounter>(RATE_LIMIT_COLLECTION);
  const counter = await counters.findOneAndUpdate(
    { _id: getRateLimitCounterId(ipHash) },
    [
      {
        $set: {
          scope: RATE_LIMIT_SCOPE,
          ipHash,
          isExpired: {
            $or: [{ $eq: ["$expiresAt", null] }, { $lte: ["$expiresAt", nowDate] }],
          },
        },
      },
      {
        $set: {
          createdAt: {
            $cond: ["$isExpired", nowDate, { $ifNull: ["$createdAt", nowDate] }],
          },
          expiresAt: {
            $cond: ["$isExpired", expiresAtDate, "$expiresAt"],
          },
          count: {
            $cond: ["$isExpired", 1, { $add: [{ $ifNull: ["$count", 0] }, 1] }],
          },
        },
      },
      {
        $unset: "isExpired",
      },
    ],
    { upsert: true, returnDocument: "after" },
  );

  const count = counter?.count ?? RATE_LIMIT_MAX_REQUESTS + 1;
  const expiresAtMs = counter?.expiresAt ? new Date(counter.expiresAt).getTime() : nowMs;
  const retryAfterSeconds = Math.max(1, Math.ceil((expiresAtMs - nowMs) / 1000));

  return {
    limited: count > RATE_LIMIT_MAX_REQUESTS,
    retryAfterSeconds,
  };
}

function getErrorDetails(err: unknown) {
  if (err instanceof MongoServerSelectionError) {
    const parts = [err.message];
    if (err.cause instanceof Error) parts.push(err.cause.message);
    return parts.join(" | ");
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 },
      );
    }

    const ip = getClientIp(req);
    const ipHash = sha256(ip);
    const ua = req.headers.get("user-agent") ?? "";

    const client = await getMongoClient();
    const db = process.env.MONGODB_DB
      ? client.db(process.env.MONGODB_DB)
      : client.db();

    await ensureRateLimitIndexes(db);
    const rateLimit = await consumeIpRateLimit(db, ipHash);
    if (rateLimit.limited) {
      return NextResponse.json(
        {
          error: `Too many requests. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
            "X-RateLimit-Window": String(RATE_LIMIT_SECONDS),
          },
        },
      );
    }

    const contactRequests = db.collection("contact_requests");
    const doc = {
      ...parsed.data,
      createdAt: new Date(),
      ipHash,
      ua,
    };

    await contactRequests.insertOne(doc);

    return NextResponse.json(
      { ok: true, cooldownSeconds: RATE_LIMIT_SECONDS },
      {
        status: 200,
        headers: {
          "X-RateLimit-Window": String(RATE_LIMIT_SECONDS),
        },
      },
    );
  } catch (err) {
    console.error("POST /api/sendmessage failed:", err);

    if (err instanceof MongoServerSelectionError) {
      const details =
        process.env.NODE_ENV !== "production"
          ? getErrorDetails(err)
          : undefined;
      return NextResponse.json(
        {
          error:
            "Database connection failed. Check Atlas IP access list, MongoDB URI, and TLS/network settings.",
          ...(details ? { details } : {}),
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 },
    );
  }
}
