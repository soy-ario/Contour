import { NextResponse } from "next/server";
import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    const user = await requireClient();
    const clientId = user.clientId;
    const body = await req.json();

    const {
      contactName, brandName, industry, website, logoUrl,
      userName, newPassword,
      timezone, currency,
    } = body;

    const clientUpdate: Record<string, unknown> = {};
    if (contactName !== undefined) clientUpdate.contactName = contactName;
    if (brandName !== undefined) clientUpdate.brandName = brandName;
    if (industry !== undefined) clientUpdate.industry = industry || null;
    if (website !== undefined) clientUpdate.website = website || null;
    if (logoUrl !== undefined) clientUpdate.logoUrl = logoUrl || null;
    if (timezone !== undefined) clientUpdate.timezone = timezone;
    if (currency !== undefined) clientUpdate.currency = currency;

    if (Object.keys(clientUpdate).length > 0) {
      await prisma.client.update({ where: { id: clientId }, data: clientUpdate });
    }

    if (userName !== undefined) {
      await prisma.user.update({ where: { id: user.id }, data: { name: userName } });
    }

    if (newPassword) {
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
      await prisma.account.updateMany({
        where: { userId: user.id, providerId: "credential" },
        data: { password: passwordHash },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUT /api/client/settings]", error);
    return NextResponse.json({ success: false, error: "Failed to save settings" }, { status: 500 });
  }
}
