import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import ContentPageContent from "@/components/features/admin/content-page-content";
import { ContentStatus, Platform, ClientStatus } from "@prisma/client";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

interface SearchParams {
  view?: string;
  search?: string;
  filterClient?: string;
  filterPlatform?: string;
  filterStatus?: string;
  month?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ContentPage({ searchParams }: PageProps) {
  const user = await requireAdmin();
  const params = await searchParams;

  const view = params.view || "list";
  const search = params.search || "";
  const filterClient = params.filterClient || "all";
  const filterPlatform = params.filterPlatform || "all";
  const filterStatus = params.filterStatus || "all";
  const month = params.month || "";

  // 1. Build Query Filters
  const where: any = {};

  if (filterClient !== "all") {
    where.clientId = filterClient;
  }

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

  // 2. Execute Data Queries
  const [contents, pendingContents, clients] = await Promise.all([
    // Main content listing query
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
    // Pending approvals listing (oldest first)
    prisma.content.findMany({
      where: {
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
    // Clients list for filter dropdown
    prisma.client.findMany({
      where: {
        status: {
          not: ClientStatus.ARCHIVED,
        },
      },
      select: {
        id: true,
        brandName: true,
      },
      orderBy: {
        brandName: "asc",
      },
    }),
  ]);

  // 3. Format Data for Client Component serialization
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
      clients={clients}
      user={sessionUser}
    />
  );
}
