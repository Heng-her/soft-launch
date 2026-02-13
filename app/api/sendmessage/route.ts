// app/api/sendmessage/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import clientPromise from "../../lib/mongodb";

export const runtime = "nodejs"; // MongoDB driver needs Node runtime

const BodySchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(100),
  phoneNumber: z
    .string()
    .trim()
    .min(5, "Phone number is required")
    .max(30)
    .regex(/^\+?[0-9\s()-]+$/, "Invalid phone number"),
  company: z.string().trim().max(120).optional().or(z.literal("")),
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

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB || "app";
    const db = client.db(dbName);
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
    return NextResponse.json({ error: "Server error" + err }, { status: 500 });
  }
}
