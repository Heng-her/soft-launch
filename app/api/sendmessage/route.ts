// app/api/sendmessage/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { MongoServerSelectionError } from "mongodb";
import getMongoClient from "../../lib/mongodb";

export const runtime = "nodejs"; // MongoDB driver needs Node runtime

const BodySchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(254),
  phoneNumber: z
    .string()
    .trim()
    .min(5, "Phone number is required")
    .max(30)
    .regex(/^\+?[0-9\s()-]+$/, "Invalid phone number"),
});

function getClientIp(req: Request) {
  // Works behind most proxies/CDNs
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const ip = xff.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return ip;
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
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
    const db = process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();
    const col = db.collection("contact_requests");

    // ✅ basic server-side rate limit: 1 request / 30 seconds per IP
    const since = new Date(Date.now() - 30_000);
    const recent = await col.findOne({ ipHash, createdAt: { $gte: since } });
    if (recent) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in 30 seconds." },
        { status: 429 },
      );
    }

    const doc = {
      ...parsed.data,
      createdAt: new Date(),
      ipHash,
      ua,
    };

    await col.insertOne(doc);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("POST /api/sendmessage failed:", err);

    if (err instanceof MongoServerSelectionError) {
      const details = process.env.NODE_ENV !== "production" ? getErrorDetails(err) : undefined;
      return NextResponse.json(
        {
          error:
            "Database connection failed. Check Atlas IP access list, MongoDB URI, and TLS/network settings.",
          ...(details ? { details } : {}),
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
