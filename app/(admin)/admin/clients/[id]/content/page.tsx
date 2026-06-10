import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import ContentPageContent from "@/components/features/admin/content-page-content";
import { ContentStatus, Platform, Prisma } from "@prisma/client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface SearchParams {
  view?: string;
  search?: string;
  filterPlatform?: string;
  filterStatus?: string;
  month?: string;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<SearchParams>;
}

export default async function ClientContentPage({ params, searchParams }: PageProps) {
  const user = await requireAdmin();
  const { id: clientId } = await params;
  const urlParams = await searchParams;

  // 1. Verify client exists
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { brandName: true },
  });

  if (!client) {
    notFound();
  }

  const view = urlParams.view || "list";
  const search = urlParams.search || "";
  const filterPlatform = urlParams.filterPlatform || "all";
  const filterStatus = urlParams.filterStatus || "all";
  const month = urlParams.month || "";

  // 2. Build Query Filters scoped to this clientId
  const where: Prisma.ContentWhereInput = {
    clientId,
  };

  if (filterPlatform !== "all") {
    where.platform = filterPlatform as Platform;
  }

  if (filterStatus !== "all") {
    where.status = filterStatus as ContentStatus;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { topic: { contains: search, mode: "insensitive" } },
      { caption: { contains: search, mode: "insensitive" } },
    ];
  }

  // If calendar view is selected, restrict content to the active month
  if (view === "calendar") {
    let year: number;
    let monthIdx: number;

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const parts = month.split("-");
      year = parseInt(parts[0], 10);
      monthIdx = parseInt(parts[1], 10) - 1;
    } else {
      const now = new Date();
      year = now.getFullYear();
      monthIdx = now.getMonth();
    }

    const startOfMonth = new Date(Date.UTC(year, monthIdx, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, monthIdx + 1, 0, 23, 59, 59, 999));

    // Combine previous where criteria with the month boundaries
    where.OR = [
      {
        scheduledAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      {
        publishDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    ];
  }

  // 3. Query Client Content and Pending Content
  const [contents, pendingContents] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        client: {
          select: {
            brandName: true,
            logoUrl: true,
          },
        },
      },
    }),
    prisma.content.findMany({
      where: {
        clientId,
        status: ContentStatus.CLIENT_APPROVAL_PENDING,
      },
      orderBy: {
        updatedAt: "asc",
      },
      include: {
        client: {
          select: {
            brandName: true,
          },
        },
      },
    }),
  ]);

  // 4. Map DB models to serializable objects
  const formattedContents = contents.map((c) => ({
    id: c.id,
    title: c.title,
    platform: c.platform,
    contentType: c.contentType,
    status: c.status,
    scheduledAt: c.scheduledAt ? c.scheduledAt.toISOString() : null,
    publishDate: c.publishDate ? c.publishDate.toISOString() : null,
    adSpend: c.adSpend ? Number(c.adSpend) : null,
    clientBrandName: c.client.brandName,
    clientId: c.clientId,
    assetUrls: c.assetUrls,
    updatedAt: c.updatedAt.toISOString(),
  }));

  const formattedPending = pendingContents.map((c) => ({
    id: c.id,
    title: c.title,
    platform: c.platform,
    contentType: c.contentType,
    status: c.status,
    scheduledAt: c.scheduledAt ? c.scheduledAt.toISOString() : null,
    publishDate: c.publishDate ? c.publishDate.toISOString() : null,
    adSpend: c.adSpend ? Number(c.adSpend) : null,
    clientBrandName: c.client.brandName,
    clientId: c.clientId,
    assetUrls: c.assetUrls,
    updatedAt: c.updatedAt.toISOString(),
  }));

  const sessionUser = {
    name: user.name || "Admin",
    email: user.email || "",
    username: user.username,
  };

  return (
    <ContentPageContent
      initialContents={formattedContents}
      pendingContents={formattedPending}
      clients={[]} // Scoped to client page, client selector not needed
      clientId={clientId}
      user={sessionUser}
    />
  );
}
