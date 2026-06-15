import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ClientTopbar from "@/components/layout/client-topbar";
import { redirect } from "next/navigation";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requireClient();
  } catch {
    redirect("/login");
  }

  const client = await prisma.client.findUnique({
    where: { id: user.clientId },
    select: { brandName: true, contractStart: true, contractEnd: true },
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F8FC]">
      <ClientTopbar
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
