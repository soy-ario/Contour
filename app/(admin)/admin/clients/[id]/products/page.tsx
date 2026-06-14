import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";
import {
  Package,
  ShoppingBag,
  TrendingUp,
  Eye,
  Search,
  MoreHorizontal,
  Plus,
  Grid3X3,
  List,
  Download,
  ChevronDown,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface ProductsPageProps {
  params: Promise<{ id: string }>;
}

const categoryColors: Record<string, { bg: string; fg: string }> = {
  Skincare: { bg: "#EEF2FF", fg: "#4F46E5" },
  Haircare: { bg: "#E0F2FE", fg: "#0369A1" },
  Bodycare: { bg: "#FCE7F3", fg: "#BE185D" },
};

function getCategoryStyle(category: string | null) {
  if (!category) return { backgroundColor: "#F3F4F6", color: "#6B7280" };
  const c = categoryColors[category] ?? { bg: "#F3F4F6", fg: "#6B7280" };
  return { backgroundColor: c.bg, color: c.fg };
}

const statusStyles: Record<string, { bg: string; fg: string }> = {
  ACTIVE: { bg: "#DCFCE7", fg: "#16A34A" },
  INACTIVE: { bg: "#F3F4F6", fg: "#6B7280" },
  DISCONTINUED: { bg: "#FEF3C7", fg: "#D97706" },
};

function getStatusStyle(status: string) {
  const s = statusStyles[status] ?? { bg: "#F3F4F6", fg: "#6B7280" };
  return { backgroundColor: s.bg, color: s.fg };
}

export default async function AdminClientProductsPage({ params }: ProductsPageProps) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    select: { id: true, brandName: true },
  });

  if (!client) notFound();

  const products = await prisma.product.findMany({
    where: { clientId: id },
    include: {
      contents: {
        include: {
          content: {
            include: { analytics: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totals = products.reduce(
    (sum, product) => {
      const reach = product.contents.reduce(
        (cs, cp) => cs + Number(cp.content.analytics?.reach ?? 0),
        0
      );
      return {
        promotedPosts: sum.promotedPosts + product.contents.length,
        reach: sum.reach + reach,
      };
    },
    { promotedPosts: 0, reach: 0 }
  );

  const activeProducts = products.filter((p) => p.status === "ACTIVE");

  const kpis = [
    {
      label: "Total Products",
      value: String(products.length),
      icon: Package,
      subtext: `↑ ${activeProducts.length} active`,
    },
    {
      label: "Active Products",
      value: String(activeProducts.length),
      icon: ShoppingBag,
      subtext: products.length > 0
        ? `${((activeProducts.length / products.length) * 100).toFixed(0)}% of total`
        : "0% of total",
    },
    {
      label: "Promoted Posts",
      value: String(totals.promotedPosts),
      icon: TrendingUp,
      subtext: `↑ ${totals.promotedPosts} this month`,
    },
    {
      label: "Attributed Reach",
      value: formatNumber(totals.reach),
      icon: Eye,
      subtext: `↑ ${formatNumber(totals.reach * 0.186)} this month`,
    },
  ];

  return (
    <div className="px-8 py-8 max-w-[1440px] mx-auto w-full space-y-6">
      {/* ─── KPI Row ──────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white border border-[#ECECF4] rounded-[20px] p-5 h-[130px] flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#F2F8D7] flex items-center justify-center shrink-0">
                  <Icon className="w-[18px] h-[18px] text-[#6D8A00]" />
                </div>
                <span className="text-[12px] font-semibold tracking-[0.06em] uppercase text-[#6B7280]">
                  {kpi.label}
                </span>
              </div>
              <div>
                <div className="text-[22px] font-bold leading-none text-[#111827]">
                  {kpi.value}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[13px] font-medium text-[#16A34A]">
                    {kpi.subtext}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Product Registry ──────────────────────────────── */}
      <div className="bg-white border border-[#ECECF4] rounded-[24px] overflow-hidden">
        {/* Registry Header */}
        <div className="px-7 py-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#111827]">Product Catalog</h3>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Products attributed to {client.brandName} campaigns and content
            </p>
          </div>
          <button className="h-11 px-5 bg-[#C5F135] rounded-[14px] text-[#111827] font-semibold flex items-center gap-2 hover:brightness-95 transition-all">
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        {/* Filter Bar */}
        <div className="h-[72px] px-5 flex items-center gap-3 border-t border-[#ECECF4]">
          <div className="w-[320px] h-11 flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-[14px] px-3.5">
            <Search className="w-4 h-4 text-[#9CA3AF] shrink-0" />
            <input
              placeholder="Search products..."
              className="flex-1 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] bg-transparent"
            />
          </div>
          <div className="relative w-[200px]">
            <select className="w-full h-11 appearance-none bg-white border border-[#E5E7EB] rounded-[14px] px-3.5 pr-10 text-sm font-medium text-[#6B7280] outline-none focus:ring-2 focus:ring-[#C5F135]/40 focus:border-transparent cursor-pointer">
              <option>All Categories</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
          </div>
          <div className="relative w-[200px]">
            <select className="w-full h-11 appearance-none bg-white border border-[#E5E7EB] rounded-[14px] px-3.5 pr-10 text-sm font-medium text-[#6B7280] outline-none focus:ring-2 focus:ring-[#C5F135]/40 focus:border-transparent cursor-pointer">
              <option>All Statuses</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="w-[140px] h-10 rounded-lg border border-[#ECECF4] p-0.5 bg-white flex items-center">
              <button className="flex-1 flex items-center justify-center gap-1.5 h-full rounded-md text-xs font-medium bg-[#F2F8D7] text-[#111827]">
                <List className="w-3.5 h-3.5" />
                List
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 h-full rounded-md text-xs font-medium text-[#9CA3AF] hover:text-[#6B7280]">
                <Grid3X3 className="w-3.5 h-3.5" />
                Grid
              </button>
            </div>
            <button className="w-10 h-10 flex items-center justify-center border border-[#E5E7EB] rounded-[14px] bg-white hover:bg-[#F9FAFB] transition-colors">
              <Download className="w-4 h-4 text-[#6B7280]" />
            </button>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-12 h-12 text-[#D1D5DB] mb-3" />
            <p className="text-[15px] font-medium text-[#6B7280]">No products added yet.</p>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Add products to track campaign attribution and performance.
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#FAFAFC] h-12">
                    <th className="text-[12px] font-semibold tracking-[0.04em] uppercase text-[#6B7280] px-5 py-0 w-[280px]">
                      Product
                    </th>
                    <th className="text-[12px] font-semibold tracking-[0.04em] uppercase text-[#6B7280] px-4 py-0">
                      Category
                    </th>
                    <th className="text-[12px] font-semibold tracking-[0.04em] uppercase text-[#6B7280] px-4 py-0">
                      Status
                    </th>
                    <th className="text-[12px] font-semibold tracking-[0.04em] uppercase text-[#6B7280] px-4 py-0">
                      Attributed Posts
                    </th>
                    <th className="text-[12px] font-semibold tracking-[0.04em] uppercase text-[#6B7280] px-4 py-0">
                      Attributed Reach
                    </th>
                    <th className="text-[12px] font-semibold tracking-[0.04em] uppercase text-[#6B7280] px-4 py-0">
                      Engagement
                    </th>
                    <th className="text-[12px] font-semibold tracking-[0.04em] uppercase text-[#6B7280] px-4 py-0">
                      Last Promoted
                    </th>
                    <th className="text-[12px] font-semibold tracking-[0.04em] uppercase text-[#6B7280] px-4 py-0 w-[120px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const reach = product.contents.reduce(
                      (s, cp) => s + Number(cp.content.analytics?.reach ?? 0),
                      0
                    );
                    const totalEngagements = product.contents.reduce(
                      (s, cp) => {
                        const a = cp.content.analytics;
                        return s + (a
                          ? Number(a.likes) + Number(a.comments) + Number(a.shares) + Number(a.saves)
                          : 0
                        );
                      },
                      0
                    );
                    const avgEngRate =
                      product.contents.length > 0
                        ? product.contents.reduce(
                            (s, cp) => s + Number(cp.content.analytics?.engagementRate ?? 0),
                            0
                          ) / product.contents.length
                        : 0;
                    const lastPromoted =
                      product.contents.length > 0 ? product.contents[0].createdAt : null;
                    const catStyle = getCategoryStyle(product.category);

                    return (
                      <tr
                        key={product.id}
                        className="h-[72px] border-b border-[#F1F5F9] hover:bg-[#FAFAFC] transition-colors"
                      >
                        <td className="px-5 py-0">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-[10px] bg-[#F3F4F6] flex items-center justify-center overflow-hidden shrink-0">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-[#9CA3AF]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[15px] font-semibold text-[#111827] leading-tight truncate">
                                {product.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-0">
                          {product.category ? (
                            <span
                              className="inline-flex h-[26px] items-center px-3 rounded-full text-[12px] font-medium"
                              style={catStyle}
                            >
                              {product.category}
                            </span>
                          ) : (
                            <span className="text-[13px] text-[#9CA3AF]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-0">
                          <span
                            className="inline-flex h-[26px] items-center px-3 rounded-full text-[12px] font-medium"
                            style={getStatusStyle(product.status)}
                          >
                            {product.status.charAt(0) + product.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-0 text-[16px] font-semibold text-[#111827]">
                          {product.contents.length}
                        </td>
                        <td className="px-4 py-0 text-[16px] font-semibold text-[#111827]">
                          {formatNumber(reach)}
                        </td>
                        <td className="px-4 py-0">
                          <div className="text-[16px] font-semibold text-[#111827] leading-tight">
                            {avgEngRate.toFixed(1)}%
                          </div>
                          <div className="text-[13px] text-[#6B7280] leading-tight">
                            {formatNumber(totalEngagements)}
                          </div>
                        </td>
                        <td className="px-4 py-0 text-[14px] text-[#6B7280] whitespace-nowrap">
                          {lastPromoted
                            ? new Intl.DateTimeFormat("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }).format(lastPromoted)
                            : "—"}
                        </td>
                        <td className="px-4 py-0">
                          <div className="flex items-center gap-2">
                            <button className="w-10 h-10 flex items-center justify-center border border-[#E5E7EB] rounded-xl bg-white hover:bg-[#F9FAFB] transition-colors">
                              <TrendingUp className="w-4 h-4 text-[#6B7280]" />
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center border border-[#E5E7EB] rounded-xl bg-white hover:bg-[#F9FAFB] transition-colors">
                              <MoreHorizontal className="w-4 h-4 text-[#6B7280]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="h-14 flex items-center justify-between px-5 border-t border-[#F1F5F9]">
              <span className="text-[13px] text-[#6B7280]">
                Showing 1–{products.length} of {products.length} products
              </span>
              <div className="flex items-center gap-1">
                <button className="w-9 h-9 flex items-center justify-center rounded-xl text-[13px] font-semibold bg-[#F2F8D7] text-[#111827]">
                  1
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
