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

  const [contents, allClientContents] = await Promise.all([
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
        analytics: true,
      },
    }),
    prisma.content.findMany({
      where: { clientId },
      select: { status: true },
    }),
  ]);

  // Status summary
  const totalItems = allClientContents.length;
  const published = allClientContents.filter(c => c.status === "POSTED").length;
  const scheduled = allClientContents.filter(c => c.status === "SCHEDULED" || c.status === "APPROVED").length;
  const drafts = allClientContents.filter(c => c.status === "DRAFT" || c.status === "IDEA").length;
  const needsReview = allClientContents.filter(c => c.status === "CLIENT_APPROVAL_PENDING").length;

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

  const sessionUser = {
    name: user.name || "Admin",
    email: user.email || "",
    username: user.username,
  };

  return (
    <ContentPageContent
      initialContents={formattedContents}
      statusSummary={statusSummary}
      clientId={clientId}
      user={sessionUser}
    />
  );
}
