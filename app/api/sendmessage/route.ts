import crypto from "crypto";
import { MongoServerSelectionError, type Db } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import getMongoClient from "../../lib/mongodb";
export const runtime = "nodejs"; // MongoDB driver needs Node runtime

// ---- Telegram env ----
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// ---- Rate limit config ----
const RATE_LIMIT_COLLECTION = "rate_limit_counters";
const RATE_LIMIT_SCOPE = "sendmessage";
const DEFAULT_RATE_LIMIT_SECONDS = 60;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 1;

const RATE_LIMIT_SECONDS = getRateLimitSecondsFromEnv();
const RATE_LIMIT_WINDOW_MS = RATE_LIMIT_SECONDS * 1_000;
const RATE_LIMIT_MAX_REQUESTS = getRateLimitMaxRequestsFromEnv();

// ---- Types ----
type RateLimitCounter = {
  _id: string;
  scope: string;
  ipHash: string;
  count: number;
  createdAt: Date;
  expiresAt: Date;
};

let rateLimitIndexesPromise: Promise<void> | undefined;

// ---- Validation ----
const BodySchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(100),
  company: z
    .string()
    .trim()
    .max(254)
    .optional(),
  phoneNumber: z
    .string()
    .trim()
    .refine((v) => v === "" || v === "+855" || /^\+855\d{8,12}$/.test(v), {
      message:
        "Phone number must be a Cambodia (+855) number with at least 8 digits",
    }),
});

// ---- Helpers ----
function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  return xff.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function ipFingerprint(ip: string): string {
  const secret = process.env.RATE_LIMIT_HASH_SECRET;
  if (!secret) return sha256(ip);
  return crypto.createHmac("sha256", secret).update(ip).digest("hex");
}

function getRateLimitSecondsFromEnv(): number {
  const value = Number(process.env.RATE_LIMIT);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_RATE_LIMIT_SECONDS;
  return Math.floor(value);
}

function getRateLimitMaxRequestsFromEnv(): number {
  const value = Number(process.env.RATE_LIMIT_MAX_REQUESTS);
  if (!Number.isFinite(value) || value <= 0)
    return DEFAULT_RATE_LIMIT_MAX_REQUESTS;
  return Math.floor(value);
}

function getRateLimitCounterId(ipHash: string): string {
  return `${RATE_LIMIT_SCOPE}:${ipHash}`;
}

async function ensureRateLimitIndexes(db: Db): Promise<void> {
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

async function consumeIpRateLimit(
  db: Db,
  ipHash: string,
): Promise<{
  limited: boolean;
  retryAfterSeconds: number;
}> {
  const nowMs = Date.now();
  const nowDate = new Date(nowMs);
  const expiresAtDate = new Date(nowMs + RATE_LIMIT_WINDOW_MS);

  const counters = db.collection<RateLimitCounter>(RATE_LIMIT_COLLECTION);

  const result = await counters.findOneAndUpdate(
    { _id: getRateLimitCounterId(ipHash) },
    [
      {
        $set: {
          scope: RATE_LIMIT_SCOPE,
          ipHash,
          isExpired: {
            $or: [
              { $eq: ["$expiresAt", null] },
              { $lte: ["$expiresAt", nowDate] },
            ],
          },
        },
      },
      {
        $set: {
          createdAt: {
            $cond: [
              "$isExpired",
              nowDate,
              { $ifNull: ["$createdAt", nowDate] },
            ],
          },
          expiresAt: { $cond: ["$isExpired", expiresAtDate, "$expiresAt"] },
          count: {
            $cond: ["$isExpired", 1, { $add: [{ $ifNull: ["$count", 0] }, 1] }],
          },
        },
      },
      { $unset: "isExpired" },
    ],
    { upsert: true, returnDocument: "after" },
  );

  const value = result;

  const count = value?.count ?? RATE_LIMIT_MAX_REQUESTS + 1;
  const expiresAtMs = value?.expiresAt
    ? new Date(value.expiresAt).getTime()
    : nowMs;

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((expiresAtMs - nowMs) / 1000),
  );

  return { limited: count > RATE_LIMIT_MAX_REQUESTS, retryAfterSeconds };
}

function getErrorDetails(err: unknown): string {
  if (err instanceof MongoServerSelectionError) {
    const parts = [err.message];
    if (err.cause instanceof Error) parts.push(err.cause.message);
    return parts.join(" | ");
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

// Escape user-provided strings to avoid HTML injection when using Telegram's HTML parse mode
function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildTelegramMessage(input: {
  fullName: string;
  company?: string;
  phoneNumber?: string;
}): string {
  const now = new Date();
  const formattedTime = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} | ${new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: "Asia/Phnom_Penh",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    },
  ).format(now)}`;

  const name = escapeHtml(input.fullName);
  const company = input.company ? escapeHtml(input.company) : undefined;
  const phone = input.phoneNumber ? escapeHtml(input.phoneNumber) : undefined;

  const lines: string[] = [];
  lines.push(`🟢 Date: ${formattedTime}`);
  lines.push("");
  lines.push("├────────────────");
  lines.push(`├ • Name    : <b>${name}</b>`);

  if (company) lines.push(`├ • Company      : <b>${company}</b>`);
  if (phone) lines.push(`├ • Phone Number : <b>${phone}</b>`);

  lines.push("├────────────────");

  return lines.join("\n");
} 

/**
 * Send Telegram notification - non-blocking, logs errors but doesn't fail the request
 */
async function sendTelegramNotification(
  fullName: string,
  company?: string,
  phoneNumber?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!BOT_TOKEN || !CHAT_ID) {
      console.error("Telegram not configured: missing BOT_TOKEN or CHAT_ID");
      return { success: false, error: "Telegram not configured" };
    }

    const telegramText = buildTelegramMessage({
      fullName,
      company,
      phoneNumber,
    });

    const telegramURL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const tgRes = await fetch(telegramURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: telegramText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!tgRes.ok) {
      const errorBody = await tgRes
        .json()
        .catch(() => ({ description: "Unknown error" }));
      const errorMessage = `Telegram API error: ${tgRes.status} - ${errorBody.description || "Unknown"}`;
      console.error(errorMessage);
      return { success: false, error: errorMessage };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = `Telegram notification failed: ${err instanceof Error ? err.message : String(err)}`;
    console.error(errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ---- Handler ----
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
    const ipHash = ipFingerprint(ip);
    const ua = (req.headers.get("user-agent") ?? "").slice(0, 300); // prevent huge UA spam

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

    // Persist request to database (PRIMARY OPERATION)
    const contactRequests = db.collection("contact_requests");

    const doc: Record<string, unknown> = {
      fullName: parsed.data.fullName,
      createdAt: new Date(),
      ipHash,
      ua,
      telegramSent: false, // Track if Telegram notification was sent
    };

    // only include optional fields when meaningful
    if (parsed.data.company && parsed.data.company !== "")
      doc.company = parsed.data.company;

    if (
      parsed.data.phoneNumber &&
      parsed.data.phoneNumber !== "" &&
      parsed.data.phoneNumber !== "+855"
    ) {
      doc.phoneNumber = parsed.data.phoneNumber;
    }

    const insertResult = await contactRequests.insertOne(doc);
    const insertedId = insertResult.insertedId;

    // Send Telegram notification (SECONDARY OPERATION - non-blocking for user)
    const telegramResult = await sendTelegramNotification(
      parsed.data.fullName,
      parsed.data.company && parsed.data.company !== ""
        ? parsed.data.company
        : undefined,
      parsed.data.phoneNumber &&
        parsed.data.phoneNumber !== "" &&
        parsed.data.phoneNumber !== "+855"
        ? parsed.data.phoneNumber
        : undefined,
    );

    // Update the document with Telegram status
    if (telegramResult.success) {
      await contactRequests
        .updateOne(
          { _id: insertedId },
          {
            $set: {
              telegramSent: true,
              telegramSentAt: new Date(),
            },
          },
        )
        .catch((err) => {
          // Log but don't fail - this is just metadata
          console.error("Failed to update Telegram status:", err);
        });
    } else {
      await contactRequests
        .updateOne(
          { _id: insertedId },
          {
            $set: {
              telegramSent: false,
              telegramError: telegramResult.error,
              telegramAttemptedAt: new Date(),
            },
          },
        )
        .catch((err) => {
          console.error("Failed to log Telegram error:", err);
        });
    }

    // ALWAYS return success if database save worked
    return NextResponse.json(
      {
        ok: true,
        cooldownSeconds: RATE_LIMIT_SECONDS,
        ...(process.env.NODE_ENV === "development" && {
          debug: {
            telegramSent: telegramResult.success,
            ...(telegramResult.error && {
              telegramError: telegramResult.error,
            }),
          },
        }),
      },
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
