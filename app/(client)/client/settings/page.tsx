import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ClientSettings from "@/components/features/client/client-settings";

export const dynamic = "force-dynamic";

export interface SettingsAccount {
  id: string;
  platform: string;
  accountName: string;
  status: string;
}

export interface SettingsData {
  clientId: string;
  contactName: string;
  brandName: string;
  industry: string;
  website: string;
  logoUrl: string | null;
  userEmail: string;
  userName: string;
  accounts: SettingsAccount[];
}

export default async function ClientSettingsPage() {
  const user = await requireClient();
  const clientId = user.clientId;

  const [client, socialAccounts] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId } }),
    prisma.socialAccount.findMany({
      where: { clientId, status: "CONNECTED" },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!client) return null;

  const data: SettingsData = {
    clientId,
    contactName: client.contactName,
    brandName: client.brandName,
    industry: client.industry || "",
    website: client.website || "",
    logoUrl: client.logoUrl,
    userEmail: user.email,
    userName: user.name,
    accounts: socialAccounts.map(a => ({
      id: a.id,
      platform: a.platform,
      accountName: a.accountName || "",
      status: a.status,
    })),
  };

  return <ClientSettings data={data} />;
}
