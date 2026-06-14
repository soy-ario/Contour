import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import ContentPageContent from "@/components/features/admin/content-page-content";
import { ContentStatus, Platform, ClientStatus, Prisma } from "@prisma/client";

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

  const where: Prisma.ContentWhereInput = {};

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
        scheduledAt: { gte: startOfMonth, lte: endOfMonth },
      },
      {
        publishDate: { gte: startOfMonth, lte: endOfMonth },
      },
    ];
  }

  const [contents, pendingContents, clients, allContents] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { brandName: true, logoUrl: true } },
        analytics: true,
      },
    }),
    prisma.content.findMany({
      where: { status: ContentStatus.CLIENT_APPROVAL_PENDING },
      orderBy: { updatedAt: "asc" },
      include: {
        client: { select: { brandName: true } },
      },
    }),
    prisma.client.findMany({
      where: { status: { not: ClientStatus.ARCHIVED } },
      select: { id: true, brandName: true },
      orderBy: { brandName: "asc" },
    }),
    prisma.content.findMany({
      select: { status: true },
    }),
  ]);

  // Status summary
  const totalItems = allContents.length;
  const published = allContents.filter(c => c.status === "POSTED").length;
  const scheduled = allContents.filter(c => c.status === "SCHEDULED" || c.status === "APPROVED").length;
  const drafts = allContents.filter(c => c.status === "DRAFT" || c.status === "IDEA").length;
  const needsReview = allContents.filter(c => c.status === "CLIENT_APPROVAL_PENDING").length;

  const statusSummary = {
    total: totalItems,
    published,
    publishedPct: totalItems > 0 ? (published / totalItems) * 100 : 0,
    scheduled,
    scheduledPct: totalItems > 0 ? (scheduled / totalItems) * 100 : 0,
    drafts,
    draftsPct: totalItems > 0 ? (drafts / totalItems) * 100 : 0,
    needsReview,
    needsReviewPct: totalItems > 0 ? (needsReview / totalItems) * 100 : 0,
  };

  const formattedContents = contents.map((c) => ({
    id: c.id,
    title: c.title,
    topic: c.topic || "",
    platform: c.platform,
    contentType: c.contentType,
    status: c.status,
    hashtags: c.hashtags,
    scheduledAt: c.scheduledAt ? c.scheduledAt.toISOString() : null,
    publishDate: c.publishDate ? c.publishDate.toISOString() : null,
    adSpend: c.adSpend ? Number(c.adSpend) : null,
    clientBrandName: c.client.brandName,
    clientId: c.clientId,
    assetUrls: c.assetUrls,
    updatedAt: c.updatedAt.toISOString(),
    views: Number(c.analytics?.views || 0),
    reach: Number(c.analytics?.reach || 0),
    likes: c.analytics?.likes || 0,
    comments: c.analytics?.comments || 0,
    shares: c.analytics?.shares || 0,
    engagementRate: c.analytics ? Number(c.analytics.engagementRate) : 0,
  }));

  const formattedPending = pendingContents.map((c) => ({
    id: c.id,
    title: c.title,
    topic: c.topic || "",
    platform: c.platform,
    contentType: c.contentType,
    status: c.status,
    hashtags: c.hashtags,
    scheduledAt: c.scheduledAt ? c.scheduledAt.toISOString() : null,
    publishDate: c.publishDate ? c.publishDate.toISOString() : null,
    adSpend: c.adSpend ? Number(c.adSpend) : null,
    clientBrandName: c.client.brandName,
    clientId: c.clientId,
    assetUrls: c.assetUrls,
    updatedAt: c.updatedAt.toISOString(),
    views: 0,
    reach: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    engagementRate: 0,
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
      statusSummary={statusSummary}
      user={sessionUser}
    />
  );
}
