import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ClientTopbar from "@/components/layout/client-topbar";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireClient();
  const client = await prisma.client.findUnique({
    where: { id: user.clientId },
    select: { brandName: true, contractStart: true, contractEnd: true },
  });

  const sessionUser = {
    name: user.name || "Client User",
    email: user.email || "client@contour.com",
    username: user.username,
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F8FC]">
      <ClientTopbar
        user={sessionUser}
        brandName={client?.brandName || "Client Portal"}
        contractStart={client?.contractStart ?? undefined}
        contractEnd={client?.contractEnd ?? undefined}
      />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
