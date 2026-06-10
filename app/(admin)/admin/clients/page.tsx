import { prisma } from "@/lib/prisma";
import ClientsPageContent from "@/components/features/admin/clients-page-content";
import { ClientStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const user = await requireAdmin();

  const clients = await prisma.client.findMany({
    where: {
      status: {
        not: "ARCHIVED" as ClientStatus,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate summary counts
  const total = clients.length;
  const active = clients.filter((c) => c.status === "ACTIVE" as ClientStatus).length;
  const paused = clients.filter((c) => c.status === "PAUSED" as ClientStatus).length;
  const onboarding = clients.filter(
    (c) =>
      c.status !== "ACTIVE" as ClientStatus &&
      c.status !== "PAUSED" as ClientStatus &&
      c.status !== "ARCHIVED" as ClientStatus
  ).length;

  // Calculate new client registrations this month
  const startOfThisMonth = new Date();
  startOfThisMonth.setDate(1);
  startOfThisMonth.setHours(0, 0, 0, 0);

  const startOfLastMonth = new Date();
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
  startOfLastMonth.setDate(1);
  startOfLastMonth.setHours(0, 0, 0, 0);

  const newClientsThisMonth = clients.filter((c) => new Date(c.createdAt) >= startOfThisMonth).length;
  const newClientsLastMonth = clients.filter((c) => {
    const d = new Date(c.createdAt);
    return d >= startOfLastMonth && d < startOfThisMonth;
  }).length;

  const totalDelta =
    newClientsLastMonth > 0
      ? (newClientsThisMonth - newClientsLastMonth) / newClientsLastMonth
      : newClientsThisMonth > 0
      ? 1
      : 0;

  // Map to matching client component props structure
  const formattedClients = clients.map((client) => ({
    id: client.id,
    brandName: client.brandName,
    industry: client.industry,
    website: client.website,
    description: client.description,
    status: client.status,
    monthlyRetainer: Number(client.monthlyRetainer),
    monthlyBudget: client.monthlyBudget ? Number(client.monthlyBudget) : null,
    healthScore: client.healthScore,
    contractStart: client.contractStart,
    contractEnd: client.contractEnd,
    contactName: client.contactName,
    contactEmail: client.contactEmail,
    contactPhone: client.contactPhone,
    logoUrl: client.logoUrl,
    amountPaid: Number(client.amountPaid),
    paymentStatus: client.paymentStatus,
    marketingTheme: client.marketingTheme,
  }));

  const stats = {
    total,
    active,
    onboarding,
    paused,
    totalDelta,
    activeDelta: active > 0 ? 0 : 0, // Placeholder or active count
  };

  const sessionUser = {
    name: user.name || "Admin",
    email: user.email || "",
    username: user.username,
  };

  return <ClientsPageContent initialClients={formattedClients} stats={stats} user={sessionUser} />;
}
