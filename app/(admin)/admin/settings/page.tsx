import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AdminSettingsForm from "@/components/features/admin/admin-settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage(props: {
  searchParams?: Promise<{ section?: string }>;
}) {
  const searchParams = await props.searchParams;
  const user = await requireAdmin();

  const sessionUser = {
    name: user.name || "Admin",
    email: user.email,
    username: user.username,
  };

  const socialAccounts = await prisma.socialAccount.findMany({
    orderBy: { platform: "asc" },
  });

  const platformCounts = socialAccounts.reduce<Record<string, number>>((acc, a) => {
    acc[a.platform] = (acc[a.platform] || 0) + 1;
    return acc;
  }, {});

  return <AdminSettingsForm user={sessionUser} platformCounts={platformCounts} defaultSection={searchParams?.section} />;
}
