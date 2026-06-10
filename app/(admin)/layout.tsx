import { requireAdmin } from "@/lib/session";
import AdminSidebar from "@/components/layout/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  const sessionUser = {
    name: user.name || "Admin User",
    email: user.email || "admin@contour.com",
    username: user.username,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar user={sessionUser} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
