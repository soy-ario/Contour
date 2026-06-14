import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ClientSettingsForm from "@/components/features/admin/client-settings-form";

export const dynamic = "force-dynamic";

interface SettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientSettingsPage({ params }: SettingsPageProps) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      socialAccounts: {
        orderBy: { platform: "asc" },
      },
    },
  });

  if (!client) notFound();

  return <ClientSettingsForm client={client} />;
}
