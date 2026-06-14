import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ClientHeader from "@/components/features/admin/client-header";
import ClientTabs from "@/components/features/admin/client-tabs";

export const dynamic = "force-dynamic";

interface ClientLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientLayout({
  children,
  params,
}: ClientLayoutProps) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
  });

  if (!client) {
    notFound();
  }

  const formattedClient = {
    id: client.id,
    brandName: client.brandName,
    status: client.status,
    logoUrl: client.logoUrl,
    healthScore: client.healthScore,
    monthlyRetainer: Number(client.monthlyRetainer),
    contractStart: client.contractStart,
    contractEnd: client.contractEnd,
    industry: client.industry,
    contactName: client.contactName,
    contactEmail: client.contactEmail,
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB]">
      <ClientHeader client={formattedClient} />
      <ClientTabs clientId={client.id} />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
