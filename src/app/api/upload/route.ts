import { NextRequest, NextResponse } from "next/server";
import { bucket } from "@/lib/firebase-admin";
import { v4 as uuid } from "uuid";

// GET: Generate a signed upload URL (client uploads directly to GCS)
export async function GET(req: NextRequest) {
  try {
    const password = req.headers.get("x-admin-password");
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileName = req.nextUrl.searchParams.get("fileName") || "file";
    const contentType = req.nextUrl.searchParams.get("contentType") || "application/octet-stream";
    const ext = fileName.split(".").pop();
    const storagePath = `rift-quiz/${uuid()}.${ext}`;

    const file = bucket.file(storagePath);
    const [signedUrl] = await file.generateSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    return NextResponse.json({ signedUrl, publicUrl, storagePath });
  } catch (error) {
    console.error("Signed URL error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

// POST: Make an uploaded file public
export async function POST(req: NextRequest) {
  try {
    const password = req.headers.get("x-admin-password");
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storagePath } = await req.json();
    const file = bucket.file(storagePath);
    await file.makePublic();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Make public error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
