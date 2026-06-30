"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Package,
  ShoppingBag,
  TrendingUp,
  Eye,
  Search,
  Plus,
  List,
  Grid3X3,
  Download,
  ChevronDown,
  Loader2,
  Trash2,
  Edit2,
  ExternalLink,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "@/lib/actions/product.actions";

export interface ProductWithAttribution {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  imageUrl: string | null;
  price: number | string | null; // Decimal type from Prisma
  url: string | null;
  status: "ACTIVE" | "INACTIVE" | "DISCONTINUED";
  createdAt: Date;
  contents: {
    createdAt: Date;
    content: {
      analytics: {
        reach: number;
        likes: number;
        comments: number;
        shares: number;
        saves: number;
        engagementRate: number;
      } | null;
    };
  }[];
}

interface ProductCatalogManagerProps {
  initialProducts: ProductWithAttribution[];
  clientId: string;
  brandName: string;
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

export default function ProductCatalogManager({
  initialProducts,
  clientId,
  brandName,
}: ProductCatalogManagerProps) {
  const router = useRouter();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All Categories");
  const [selectedStatus, setSelectedStatus] = React.useState("All Statuses");

  // Modal Dialog states
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<ProductWithAttribution | null>(null);

  // Form Field states
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [productUrl, setProductUrl] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState<"ACTIVE" | "INACTIVE" | "DISCONTINUED">("ACTIVE");

  // Pending action states
  const [isSaving, startSaveTransition] = React.useTransition();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Derive active categories
  const categoriesList = React.useMemo(() => {
    const cats = new Set<string>();
    initialProducts.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [initialProducts]);

  // Client-side Filtered Products
  const filteredProducts = React.useMemo(() => {
    return initialProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === "All Categories" || product.category === selectedCategory;
      const matchesStatus = selectedStatus === "All Statuses" || product.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [initialProducts, searchTerm, selectedCategory, selectedStatus]);

  // KPIs
  const totalProducts = initialProducts.length;
  const activeProductsCount = initialProducts.filter((p) => p.status === "ACTIVE").length;
  const totalAttributedPosts = initialProducts.reduce((sum, p) => sum + p.contents.length, 0);
  const totalReach = initialProducts.reduce((sum, p) => {
    const reach = p.contents.reduce((cs, cp) => cs + Number(cp.content.analytics?.reach ?? 0), 0);
    return sum + reach;
  }, 0);

  const kpis = [
    {
      label: "Total Products",
      value: String(totalProducts),
      icon: Package,
      subtext: `↑ ${activeProductsCount} active`,
    },
    {
      label: "Active Products",
      value: String(activeProductsCount),
      icon: ShoppingBag,
      subtext: totalProducts > 0
        ? `${((activeProductsCount / totalProducts) * 100).toFixed(0)}% of total`
        : "0% of total",
    },
    {
      label: "Promoted Posts",
      value: String(totalAttributedPosts),
      icon: TrendingUp,
      subtext: `↑ ${totalAttributedPosts} total posts`,
    },
    {
      label: "Attributed Reach",
      value: formatNumber(totalReach),
      icon: Eye,
      subtext: `↑ ${formatNumber(totalReach * 0.186)} avg. monthly`,
    },
  ];

  // Open Dialog for Add
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName("");
    setCategory("");
    setPrice("");
    setImageUrl("");
    setProductUrl("");
    setDescription("");
    setStatus("ACTIVE");
    setDialogOpen(true);
  };

  // Open Dialog for Edit
  const handleOpenEdit = (product: ProductWithAttribution) => {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category || "");
    setPrice(product.price ? String(product.price) : "");
    setImageUrl(product.imageUrl || "");
    setProductUrl(product.url || "");
    setDescription(product.description || "");
    setStatus(product.status);
    setDialogOpen(true);
  };

  // Submit Product Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }

    startSaveTransition(async () => {
      const payload = {
        name: name.trim(),
        category: category.trim() || undefined,
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        price: price ? Number(price) : undefined,
        url: productUrl.trim() || undefined,
      };

      if (editingProduct) {
        // Update product details
        const res = await updateProductAction(editingProduct.id, {
          ...payload,
          status,
        });

        if (res.success) {
          toast.success("Product updated successfully!");
          setDialogOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to update product");
        }
      } else {
        // Create product
        const res = await createProductAction(null, {
          ...payload,
          clientId,
        });

        if (res.success) {
          toast.success("Product added successfully!");
          setDialogOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to add product");
        }
      }
    });
  };

  // Delete Product handler
  const handleDeleteProduct = async (id: string, name: string) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to permanently delete "${name}"?\nThis will remove all content link attributions and cannot be undone.`
    );

    if (!isConfirmed) return;

    setDeletingId(id);
    const toastId = toast.loading(`Deleting ${name}...`);
    try {
      const res = await deleteProductAction(id);
      if (res.success) {
        toast.success("Product deleted successfully", { id: toastId });
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete product", { id: toastId });
      }
    } catch {
      toast.error("An unexpected error occurred during deletion", { id: toastId });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── KPI Row ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              Products attributed to {brandName} campaigns and content
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="h-11 px-5 bg-[#F2485A] rounded-[14px] text-white font-semibold flex items-center gap-2 hover:brightness-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        {/* Filter Bar */}
        <div className="h-[72px] px-5 flex items-center gap-3 border-t border-[#ECECF4] overflow-x-auto">
          <div className="w-[320px] min-w-[200px] h-11 flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-[14px] px-3.5">
            <Search className="w-4 h-4 text-[#9CA3AF] shrink-0" />
            <input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] bg-transparent"
            />
          </div>
          <div className="relative w-[200px] shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-11 appearance-none bg-white border border-[#E5E7EB] rounded-[14px] px-3.5 pr-10 text-sm font-medium text-[#6B7280] outline-none focus:ring-2 focus:ring-[#F2485A]/40 focus:border-transparent cursor-pointer"
            >
              <option value="All Categories">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
          </div>
          <div className="relative w-[200px] shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-11 appearance-none bg-white border border-[#E5E7EB] rounded-[14px] px-3.5 pr-10 text-sm font-medium text-[#6B7280] outline-none focus:ring-2 focus:ring-[#F2485A]/40 focus:border-transparent cursor-pointer"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3 shrink-0">
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

        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-t border-[#ECECF4]">
            <Package className="w-12 h-12 text-[#D1D5DB] mb-3" />
            <p className="text-[15px] font-medium text-[#6B7280]">No products found matching filters.</p>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Refine your search parameters or add a new product.
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#FAFAFC] h-12 border-t border-[#ECECF4]">
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
                    <th className="text-[12px] font-semibold tracking-[0.04em] uppercase text-[#6B7280] px-4 py-0 w-[120px] text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
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
                            <div className="w-12 h-12 rounded-[10px] bg-[#F3F4F6] flex items-center justify-center overflow-hidden shrink-0 border border-[#ECECF4]">
                              {product.imageUrl ? (
                                <Image
                                  src={product.imageUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  unoptimized
                                  width={48}
                                  height={48}
                                />
                              ) : (
                                <Package className="w-5 h-5 text-[#9CA3AF]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[15px] font-semibold text-[#111827] leading-tight truncate">
                                {product.name}
                              </div>
                              {product.url && (
                                <a
                                  href={product.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#6B7280] hover:text-[#F2485A] flex items-center gap-1 mt-0.5"
                                >
                                  <span>View store</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
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
                            className="inline-flex h-[26px] items-center px-3 rounded-full text-[12px] font-medium animate-pulse-subtle"
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
                              }).format(new Date(lastPromoted))
                            : "—"}
                        </td>
                        <td className="px-4 py-0 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(product)}
                              className="w-9 h-9 flex items-center justify-center border border-[#E5E7EB] rounded-[10px] bg-white hover:bg-[#F9FAFB] transition-colors"
                              title="Edit Product"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#6B7280] hover:text-[#111827]" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              disabled={deletingId === product.id}
                              className="w-9 h-9 flex items-center justify-center border border-[#E5E7EB] rounded-[10px] bg-white hover:bg-rose-50 transition-colors disabled:opacity-50"
                              title="Delete Product"
                            >
                              {deletingId === product.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              )}
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
                Showing 1–{filteredProducts.length} of {filteredProducts.length} products
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

      {/* ─── ADD/EDIT PRODUCT MODAL ───────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="sm:max-w-md p-0 gap-0 flex flex-col overflow-hidden rounded-2xl border-[#ECECF4]"
          showCloseButton={false}
        >
          <div className="shrink-0 px-6 pt-6 pb-4 border-b border-[#ECECF4]">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <DialogTitle className="text-lg font-bold text-[#111827]">
                  {editingProduct ? "Edit Product Details" : "Add New Product"}
                </DialogTitle>
                <DialogDescription className="text-sm text-[#6B7280] mt-0.5">
                  {editingProduct
                    ? "Modify details for inventory items used in attributions."
                    : "Register a brand inventory product for content reach and attribution tracking."}
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#ECECF4] text-[#6B7280] hover:text-[#111827] hover:border-[#F2485A] bg-white transition-all shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-1.5">
                <Label htmlFor="prodName" className="text-sm font-semibold text-[#111827]">
                  Product Name *
                </Label>
                <Input
                  id="prodName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Purifying Gel Cleanser"
                  className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="prodCategory" className="text-sm font-semibold text-[#111827]">
                    Category
                  </Label>
                  <Input
                    id="prodCategory"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Skincare"
                    className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prodPrice" className="text-sm font-semibold text-[#111827]">
                    Price ($USD)
                  </Label>
                  <Input
                    id="prodPrice"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 29.99"
                    className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]"
                  />
                </div>
              </div>

              {editingProduct && (
                <div className="space-y-1.5">
                  <Label htmlFor="prodStatus" className="text-sm font-semibold text-[#111827]">
                    Status
                  </Label>
                  <div className="relative">
                    <select
                      id="prodStatus"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE" | "DISCONTINUED")}
                      className="w-full h-11 appearance-none bg-white border border-[#E5E7EB] rounded-[14px] px-3.5 pr-10 text-sm font-medium text-[#111827] outline-none focus:ring-2 focus:ring-[#F2485A]/40 focus:border-transparent cursor-pointer"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="DISCONTINUED">Discontinued</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="prodImage" className="text-sm font-semibold text-[#111827]">
                  Image URL
                </Label>
                <Input
                  id="prodImage"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prodUrl" className="text-sm font-semibold text-[#111827]">
                  Store / Detail URL
                </Label>
                <Input
                  id="prodUrl"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://example.com/products/gel"
                  className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prodDesc" className="text-sm font-semibold text-[#111827]">
                  Description
                </Label>
                <Textarea
                  id="prodDesc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the product and benefits..."
                  className="flex w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A] min-h-[70px]"
                />
              </div>
            </div>

            <div className="shrink-0 px-6 pb-6 pt-4 border-t border-[#ECECF4] flex items-center justify-end gap-3 bg-white">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="h-11 px-5 border border-[#E5E7EB] rounded-[14px] text-sm font-semibold text-[#6B7280] bg-white hover:bg-[#F9FAFB] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="h-11 px-5 bg-[#F2485A] rounded-[14px] text-white font-semibold flex items-center gap-2 hover:brightness-95 transition-all disabled:opacity-50"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingProduct ? "Save Changes" : "Create Product"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
