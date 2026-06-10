import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OnboardingProgress from "@/components/features/admin/onboarding-progress";
import InternalNotes from "@/components/features/admin/internal-notes";
import StatCard from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/shared/status-badge";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/utils";
import {
  Globe,
  Mail,
  Phone,
  User,
  Calendar,
  DollarSign,
  Share2,
} from "lucide-react";
import { Platform, ClientStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

// Custom inline SVGs for social platforms since they are missing from lucide-react in this environment
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
  </svg>
);

export const dynamic = "force-dynamic";

interface OverviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientOverviewPage({ params }: OverviewPageProps) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      socialAccounts: true,
      internalNotes: {
        include: {
          creator: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          contents: true,
          products: true,
          requests: true,
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  // Calculate current month date ranges
  const startOfThisMonth = new Date();
  startOfThisMonth.setDate(1);
  startOfThisMonth.setHours(0, 0, 0, 0);

  const startOfLastMonth = new Date();
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
  startOfLastMonth.setDate(1);
  startOfLastMonth.setHours(0, 0, 0, 0);

  // Fetch current month snapshots
  const thisMonthSnapshots = await prisma.analyticsSnapshot.findMany({
    where: {
      clientId: id,
      periodStart: {
        gte: startOfThisMonth,
      },
    },
  });

  // Fetch last month snapshots for deltas
  const lastMonthSnapshots = await prisma.analyticsSnapshot.findMany({
    where: {
      clientId: id,
      periodStart: {
        gte: startOfLastMonth,
        lt: startOfThisMonth,
      },
    },
  });

  // Aggregate stats
  const viewsThisMonth = thisMonthSnapshots.reduce((acc, s) => acc + Number(s.totalViews), 0);
  const reachThisMonth = thisMonthSnapshots.reduce((acc, s) => acc + Number(s.totalReach), 0);
  const followersThisMonth = thisMonthSnapshots.reduce((acc, s) => acc + Number(s.followerGrowth), 0);
  const engRateThisMonth =
    thisMonthSnapshots.length > 0
      ? thisMonthSnapshots.reduce((acc, s) => acc + Number(s.avgEngagementRate || 0), 0) /
        thisMonthSnapshots.length
      : 0;

  const viewsLastMonth = lastMonthSnapshots.reduce((acc, s) => acc + Number(s.totalViews), 0);
  const reachLastMonth = lastMonthSnapshots.reduce((acc, s) => acc + Number(s.totalReach), 0);
  const followersLastMonth = lastMonthSnapshots.reduce((acc, s) => acc + Number(s.followerGrowth), 0);
  const engRateLastMonth =
    lastMonthSnapshots.length > 0
      ? lastMonthSnapshots.reduce((acc, s) => acc + Number(s.avgEngagementRate || 0), 0) /
        lastMonthSnapshots.length
      : 0;

  // Calculate deltas
  const viewsDelta = viewsLastMonth > 0 ? (viewsThisMonth - viewsLastMonth) / viewsLastMonth : 0;
  const reachDelta = lastMonthSnapshots.length > 0 ? (reachThisMonth - reachLastMonth) / reachLastMonth : 0;
  const followersDelta =
    followersLastMonth > 0 ? (followersThisMonth - followersLastMonth) / followersLastMonth : 0;
  const engDelta = engRateLastMonth > 0 ? (engRateThisMonth - engRateLastMonth) / engRateLastMonth : 0;

  // Social account connection mapping
  const platforms = [
    { name: "INSTAGRAM", label: "Instagram", icon: InstagramIcon, color: "text-pink-500" },
    { name: "FACEBOOK", label: "Facebook", icon: FacebookIcon, color: "text-blue-600" },
    { name: "TIKTOK", label: "TikTok", icon: Share2, color: "text-cyan-400" }, // tiktok brand fallback
    { name: "LINKEDIN", label: "LinkedIn", icon: LinkedinIcon, color: "text-blue-500" },
    { name: "YOUTUBE", label: "YouTube", icon: YoutubeIcon, color: "text-red-500" },
    { name: "X", label: "X (Twitter)", icon: TwitterIcon, color: "text-zinc-200" },
  ];

  const socialConnectionStatus = platforms.map((p) => {
    const matched = client.socialAccounts.find((sa) => sa.platform === p.name as Platform);
    return {
      ...p,
      connected: !!matched,
      accountName: matched?.accountName || null,
      status: matched?.status || "DISCONNECTED",
      lastSyncAt: matched?.lastSyncAt || null,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
      {/* Onboarding Pipeline */}
      <OnboardingProgress
        status={client.status}
        socialCount={client.socialAccounts.length}
        productCount={client._count.products}
      />

      {/* Monthly Performance Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Monthly Views"
          value={formatNumber(viewsThisMonth)}
          delta={viewsDelta}
          deltaLabel="vs last month"
        />
        <StatCard
          label="Estimated Monthly Reach"
          value={formatNumber(reachThisMonth)}
          delta={reachDelta}
          deltaLabel="vs last month"
        />
        <StatCard
          label="Avg Engagement Rate"
          value={formatPercent(engRateThisMonth)}
          delta={engDelta}
          deltaLabel="vs last month"
        />
        <StatCard
          label="Net Followers Gained"
          value={formatNumber(followersThisMonth)}
          delta={followersDelta}
          deltaLabel="vs last month"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Business & Contact Info (Span 2) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Client Profile Details */}
          <Card className="bg-card border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/40 py-4 px-6">
              <CardTitle className="text-base font-bold text-foreground">
                Client Profile details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Business Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Business Details</h4>
                <div className="space-y-3">
                  {client.website && (
                    <div className="flex items-center text-sm text-foreground/80 space-x-2.5">
                      <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                      <a
                        href={client.website}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-primary transition-colors truncate"
                      >
                        {client.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-foreground/80 space-x-2.5">
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{client.contactName}</span>
                  </div>
                  <div className="flex items-center text-sm text-foreground/80 space-x-2.5">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{client.contactEmail}</span>
                  </div>
                  {client.contactPhone && (
                    <div className="flex items-center text-sm text-foreground/80 space-x-2.5">
                      <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>{client.contactPhone}</span>
                    </div>
                  )}
                </div>
                {client.description && (
                  <div className="pt-2">
                    <p className="text-xs font-medium text-muted-foreground">About the Brand</p>
                    <p className="text-sm text-foreground/70 mt-1 leading-relaxed">
                      {client.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Billing Section */}
              <div className="space-y-4 border-t md:border-t-0 md:border-l border-border/60 pt-4 md:pt-0 md:pl-8">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Financial & Contract</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Monthly Retainer:</span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(Number(client.monthlyRetainer))}
                    </span>
                  </div>
                  {client.monthlyBudget && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Monthly Ad Budget:</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(Number(client.monthlyBudget))}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Contract Start:</span>
                    <span className="text-foreground">
                      {client.contractStart ? formatDate(client.contractStart, "PP") : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Contract End:</span>
                    <span className="text-foreground">
                      {client.contractEnd ? formatDate(client.contractEnd, "PP") : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Payment Status:</span>
                    <StatusBadge status={client.paymentStatus} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Internal Notes Section */}
          <InternalNotes clientId={client.id} initialNotes={client.internalNotes} />
        </div>

        {/* Right Column: Integration Connection Status */}
        <div className="space-y-8">
          <Card className="bg-card border-border/60 shadow-sm h-full">
            <CardHeader className="border-b border-border/40 py-4 px-6">
              <CardTitle className="text-base font-bold text-foreground">
                Connected Social Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground leading-normal mb-2">
                Connections represent active API sync streams used to pull automated data views.
              </p>
              
              <div className="divide-y divide-border/40">
                {socialConnectionStatus.map((sa) => {
                  const PlatformIcon = sa.icon;
                  return (
                    <div key={sa.name} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                      <div className="flex items-center space-x-3 min-w-0">
                        <PlatformIcon className={cn("w-5 h-5 shrink-0", sa.color)} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-foreground">
                            {sa.label}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {sa.connected && sa.accountName ? `@${sa.accountName}` : "Not Connected"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <StatusBadge status={sa.connected ? "ACTIVE" : "INACTIVE"} size="sm" />
                        {sa.connected && sa.lastSyncAt && (
                          <span className="text-[9px] text-zinc-500 mt-1">
                            Synced {formatDate(sa.lastSyncAt, "MMM dd")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
