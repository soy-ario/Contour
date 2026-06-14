import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Package, ShoppingBag, DollarSign, BarChart3, Eye, Heart, MessageSquare, Share2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientProductsPage() {
  const user = await requireClient();

  const products = await prisma.product.findMany({
    where: { clientId: user.clientId },
    include: {
      contents: {
        include: {
          content: {
            include: { analytics: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalProducts = products.length;
  const totalRevenue = products.reduce((sum, p) => sum + Number(p.price || 0), 0);
  const totalContent = products.reduce((sum, p) => sum + p.contents.length, 0);

  return (
    <div className="py-8 px-8 mx-auto" style={{ maxWidth: 1440 }}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">Products</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Products promoted through content and their attributed performance.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white border border-[#ECECF4] rounded-[20px] p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#F2F8D7] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-[#6B7280]" />
              </div>
              <span className="text-xs font-medium text-gray-500">Total Products</span>
            </div>
            <div className="text-[32px] font-extrabold text-[#111827] leading-none tracking-tight">{totalProducts}</div>
          </div>
          <div className="bg-white border border-[#ECECF4] rounded-[20px] p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#F2F8D7] flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-[#6B7280]" />
              </div>
              <span className="text-xs font-medium text-gray-500">Total Value</span>
            </div>
            <div className="text-[32px] font-extrabold text-[#111827] leading-none tracking-tight">{formatCurrency(totalRevenue)}</div>
          </div>
          <div className="bg-white border border-[#ECECF4] rounded-[20px] p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#F2F8D7] flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#6B7280]" />
              </div>
              <span className="text-xs font-medium text-gray-500">Content Mentions</span>
            </div>
            <div className="text-[32px] font-extrabold text-[#111827] leading-none tracking-tight">{totalContent}</div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {products.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3">
              <div className="bg-white border border-[#ECECF4] rounded-[24px] p-10 text-center">
                <div className="w-12 h-12 rounded-full bg-[#F4F4FA] flex items-center justify-center mx-auto mb-3">
                  <Package className="w-5 h-5 text-[#6B7280]" />
                </div>
                <p className="text-sm font-medium text-[#111827]">No products added yet</p>
                <p className="text-xs text-[#6B7280] mt-1">Products will appear here once your team adds them.</p>
              </div>
            </div>
          ) : (
            products.map((product) => {
              const totalReach = product.contents.reduce((sum, item) => sum + Number(item.content.analytics?.reach ?? 0), 0);
              const totalEngagement = product.contents.reduce(
                (sum, item) =>
                  sum +
                  Number(item.content.analytics?.likes ?? 0) +
                  Number(item.content.analytics?.comments ?? 0) +
                  Number(item.content.analytics?.shares ?? 0) +
                  Number(item.content.analytics?.saves ?? 0),
                0
              );
              const totalViews = product.contents.reduce((sum, item) => sum + Number(item.content.analytics?.views ?? 0), 0);

              const status = product.status;
              const isActive = status === "ACTIVE";

              return (
                <div key={product.id} className="bg-white border border-[#ECECF4] rounded-[20px] p-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-[#111827] truncate">{product.name}</h3>
                      <p className="text-xs text-[#6B7280] mt-0.5">{product.category ?? "Uncategorized"}</p>
                    </div>
                    <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-500"
                    }`}>
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {product.description && (
                    <p className="text-xs text-[#6B7280] leading-relaxed mb-4 line-clamp-2">{product.description}</p>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                      <DollarSign className="w-3 h-3" />
                      {product.price ? formatCurrency(Number(product.price)) : "-"}
                    </div>
                    <span className="w-1 h-1 rounded-full bg-[#ECECF4]" />
                    <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                      <ShoppingBag className="w-3 h-3" />
                      {product.contents.length} posts
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#ECECF4]">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <Eye className="w-3.5 h-3.5 mx-auto text-[#9CA3AF] mb-1" />
                        <p className="text-xs font-semibold text-[#111827]">{formatNumber(totalViews)}</p>
                        <p className="text-[10px] text-[#9CA3AF]">Views</p>
                      </div>
                      <div>
                        <Heart className="w-3.5 h-3.5 mx-auto text-[#9CA3AF] mb-1" />
                        <p className="text-xs font-semibold text-[#111827]">{formatNumber(totalEngagement)}</p>
                        <p className="text-[10px] text-[#9CA3AF]">Engagement</p>
                      </div>
                      <div>
                        <BarChart3 className="w-3.5 h-3.5 mx-auto text-[#9CA3AF] mb-1" />
                        <p className="text-xs font-semibold text-[#111827]">{formatNumber(totalReach)}</p>
                        <p className="text-[10px] text-[#9CA3AF]">Reach</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
