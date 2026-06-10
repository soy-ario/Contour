import { requireClient } from "@/lib/session";
import ClientTopbar from "@/components/layout/client-topbar";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireClient();

  const sessionUser = {
    name: user.name || "Client User",
    email: user.email || "client@contour.com",
    username: user.username,
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ClientTopbar user={sessionUser} />
      <main className="flex-1 flex flex-col min-w-0 p-6">
        {children}
      </main>
    </div>
  );
}
