import { NextResponse } from "next/server";
import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  try {
    const user = await requireClient();
    const clientId = user.clientId;
    const formData = await req.formData();
    const file = formData.get("logo") as File | null;
    if (!file) return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Only PNG, JPEG, WebP, and SVG images are allowed" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mime = file.type;
    const dataUrl = `data:${mime};base64,${base64}`;

    await prisma.client.update({ where: { id: clientId }, data: { logoUrl: dataUrl } });

    return NextResponse.json({ success: true, logoUrl: dataUrl });
  } catch (error) {
    console.error("[POST /api/client/logo]", error);
    return NextResponse.json({ success: false, error: "Failed to upload logo" }, { status: 500 });
  }
}
