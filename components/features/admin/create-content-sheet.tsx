"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Platform, ContentStatus, ContentType } from "@prisma/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createContentSchema } from "@/lib/validations/content";
import { createContentAction, updateContentAction } from "@/lib/actions/content.actions";
import { toast } from "sonner";
import { Loader2, Plus, X, Package } from "lucide-react";
import { PLATFORM_LABELS, CONTENT_TYPE_LABELS } from "@/types";

interface ClientListItem {
  id: string;
  brandName: string;
}

interface Product {
  id: string;
  name: string;
}

interface CreateContentSheetProps {
  clientId?: string | null; // Pre-filled if scoped to client page
  contentIdToEdit?: string | null; // If editing an existing item
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Form values schema on client side (keeping dates and spend as string/number for form inputs)
interface ContentFormValues {
  clientId: string;
  title: string;
  topic: string;
  platform: Platform;
  contentType: ContentType;
  caption: string;
  script: string;
  hashtagsString: string;
  assetUrlsString: string;
  adSpend: string;
  notes: string;
  productIds: string[];
}

export default function CreateContentSheet({
  clientId,
  contentIdToEdit,
  open,
  onOpenChange,
  onSuccess,
}: CreateContentSheetProps) {
  const [loadingClients, setLoadingClients] = React.useState(false);
  const [loadingProducts, setLoadingProducts] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [clients, setClients] = React.useState<ClientListItem[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);

  const isEditMode = !!contentIdToEdit;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ContentFormValues>({
    defaultValues: {
      clientId: clientId || "",
      title: "",
      topic: "",
      platform: "INSTAGRAM",
      contentType: "REEL",
      caption: "",
      script: "",
      hashtagsString: "",
      assetUrlsString: "",
      adSpend: "0",
      notes: "",
      productIds: [],
    },
  });

  const selectedClientId = watch("clientId");
  const selectedPlatform = watch("platform");
  const selectedContentType = watch("contentType");
  const selectedProducts = watch("productIds") || [];

  // Fetch clients if no clientId is provided (Global Admin Mode)
  React.useEffect(() => {
    if (open && !clientId && !isEditMode) {
      setLoadingClients(true);
      fetch("/api/clients")
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            setClients(res.data);
          }
        })
        .catch(() => toast.error("Failed to load clients list"))
        .finally(() => setLoadingClients(false));
    }
  }, [open, clientId, isEditMode]);

  // Fetch products when selectedClientId changes
  React.useEffect(() => {
    if (open && selectedClientId) {
      setLoadingProducts(true);
      fetch(`/api/clients/${selectedClientId}/products`)
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            setProducts(res.data || []);
          } else {
            setProducts([]); // Fallback
          }
        })
        .catch(() => {
          // If product api doesn't exist yet in development, swallow error gracefully
          setProducts([]);
        })
        .finally(() => setLoadingProducts(false));
    } else {
      setProducts([]);
    }
  }, [open, selectedClientId]);

  // Fetch content details for Editing Mode
  React.useEffect(() => {
    if (open && isEditMode && contentIdToEdit && selectedClientId) {
      fetch(`/api/clients/${selectedClientId}/content/${contentIdToEdit}`)
        .then((res) => res.json())
        .then((res) => {
          if (res.success && res.data) {
            const item = res.data;
            reset({
              clientId: item.clientId,
              title: item.title,
              topic: item.topic || "",
              platform: item.platform,
              contentType: item.contentType,
              caption: item.caption || "",
              script: item.script || "",
              hashtagsString: item.hashtags ? item.hashtags.join(", ") : "",
              assetUrlsString: item.assetUrls ? item.assetUrls.join(", ") : "",
              adSpend: item.adSpend ? String(item.adSpend) : "0",
              notes: item.notes || "",
              productIds: item.products ? item.products.map((p: any) => p.id) : [],
            });
          }
        })
        .catch(() => toast.error("Failed to load content for editing"));
    }
  }, [open, isEditMode, contentIdToEdit, selectedClientId, reset]);

  // Reset form when sheet opens/closes
  React.useEffect(() => {
    if (!open) {
      reset({
        clientId: clientId || "",
        title: "",
        topic: "",
        platform: "INSTAGRAM",
        contentType: "REEL",
        caption: "",
        script: "",
        hashtagsString: "",
        assetUrlsString: "",
        adSpend: "0",
        notes: "",
        productIds: [],
      });
    }
  }, [open, clientId, reset]);

  const handleProductToggle = (productId: string) => {
    const current = [...selectedProducts];
    const index = current.indexOf(productId);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(productId);
    }
    setValue("productIds", current);
  };

  const onSubmit = async (values: ContentFormValues) => {
    setSaving(true);
    try {
      const hashtags = values.hashtagsString
        ? values.hashtagsString
            .split(",")
            .map((t) => t.trim().replace("#", ""))
            .filter(Boolean)
        : [];

      const assetUrls = values.assetUrlsString
        ? values.assetUrlsString
            .split(",")
            .map((u) => u.trim())
            .filter(Boolean)
        : [];

      const formattedData = {
        clientId: values.clientId,
        title: values.title,
        topic: values.topic || undefined,
        platform: values.platform,
        contentType: values.contentType,
        caption: values.caption || undefined,
        script: values.script || undefined,
        hashtags,
        assetUrls,
        adSpend: values.adSpend ? Number(values.adSpend) : 0,
        notes: values.notes || undefined,
        productIds: values.productIds,
      };

      let result;
      if (isEditMode && contentIdToEdit) {
        result = await updateContentAction(contentIdToEdit, formattedData);
      } else {
        // Create content action takes prevState and formData as argument because of useActionState signatures
        result = await createContentAction({}, formattedData);
      }

      if (result.success) {
        toast.success(isEditMode ? "Content updated successfully!" : "Content idea created successfully!");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Operation failed");
      }
    } catch (e: any) {
      toast.error(e.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto bg-zinc-950 border-l border-zinc-800 text-zinc-300 p-0 flex flex-col h-full scrollbar-thin">
        <SheetHeader className="p-6 pb-4 border-b border-zinc-850 bg-zinc-900/30">
          <SheetTitle className="text-lg font-bold text-white">
            {isEditMode ? "Edit Content Details" : "Create Content Idea"}
          </SheetTitle>
          <SheetDescription className="text-xs text-zinc-500">
            {isEditMode
              ? "Update description, assets, and metadata for this content item."
              : "Draft a new content item. Created items will start in the 'Idea' stage."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 p-6 space-y-5 overflow-y-auto">
            {/* Client Selector (Global mode only, disabled in edit mode) */}
            {!clientId && !isEditMode && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Client / Brand</label>
                {loadingClients ? (
                  <div className="flex items-center space-x-2 text-zinc-500 text-xs py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading clients...</span>
                  </div>
                ) : (
                  <Select
                    value={selectedClientId}
                    onValueChange={(val) => setValue("clientId", val || "")}
                  >
                    <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 focus:ring-zinc-700 text-sm text-zinc-200">
                      <SelectValue placeholder="Select a Client Brand" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.brandName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.clientId && (
                  <span className="text-[10px] text-rose-500">{errors.clientId.message}</span>
                )}
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Working Title</label>
              <Input
                placeholder="e.g. Summer Collection Launch Reel"
                {...register("title", { required: "Title is required" })}
                className="bg-zinc-900 border-zinc-850 text-sm focus-visible:ring-zinc-700 placeholder:text-zinc-600"
              />
              {errors.title && (
                <span className="text-[10px] text-rose-500">{errors.title.message}</span>
              )}
            </div>

            {/* Concept / Topic */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Topic / Concept Theme</label>
              <Input
                placeholder="e.g. Fashion, Behind the scenes, Q&A"
                {...register("topic")}
                className="bg-zinc-900 border-zinc-850 text-sm focus-visible:ring-zinc-700 placeholder:text-zinc-600"
              />
            </div>

            {/* Platform & Content Type (Grid) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Platform</label>
                <Select
                  value={selectedPlatform}
                  onValueChange={(val) => setValue("platform", val as Platform)}
                >
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-850 focus:ring-zinc-700 text-sm text-zinc-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-850 text-zinc-200">
                    {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Content Type</label>
                <Select
                  value={selectedContentType}
                  onValueChange={(val) => setValue("contentType", val as ContentType)}
                >
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-850 focus:ring-zinc-700 text-sm text-zinc-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-850 text-zinc-200">
                    {Object.entries(CONTENT_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Caption */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Caption / Copy</label>
              <Textarea
                placeholder="Write caption copy, call to actions, etc..."
                {...register("caption")}
                className="bg-zinc-900 border-zinc-850 text-sm focus-visible:ring-zinc-700 placeholder:text-zinc-600 min-h-[100px]"
              />
            </div>

            {/* Video Script */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Video Script / Hook / Notes</label>
              <Textarea
                placeholder="Hook: [text]\nBody: [text]\nCTA: [text]"
                {...register("script")}
                className="bg-zinc-900 border-zinc-850 text-sm font-mono focus-visible:ring-zinc-700 placeholder:text-zinc-600 min-h-[120px]"
              />
            </div>

            {/* Hashtags (Comma-separated) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Hashtags (comma separated)</label>
              <Input
                placeholder="e.g. summerfashion, stylingtips, agency"
                {...register("hashtagsString")}
                className="bg-zinc-900 border-zinc-850 text-sm focus-visible:ring-zinc-700 placeholder:text-zinc-600"
              />
            </div>

            {/* Asset URLs (Comma-separated or presigned file upload fallback) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Asset URLs (comma separated)</label>
              <Input
                placeholder="e.g. https://images.unsplash.com/photo-1, https://..."
                {...register("assetUrlsString")}
                className="bg-zinc-900 border-zinc-850 text-sm focus-visible:ring-zinc-700 placeholder:text-zinc-600"
              />
              <span className="text-[10px] text-zinc-500 block">
                Enter comma-separated public URLs. Full upload directly to R2 bucket will be integrated in Phase 9.
              </span>
            </div>

            {/* Ad Spend & Budget Allocations */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Allocated Ad Spend Budget ($)</label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                {...register("adSpend")}
                className="bg-zinc-900 border-zinc-850 text-sm focus-visible:ring-zinc-700 placeholder:text-zinc-600"
              />
            </div>

            {/* Team Notes (Admin notes) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Internal Team Notes</label>
              <Textarea
                placeholder="Enter notes visible only to the agency team..."
                {...register("notes")}
                className="bg-zinc-900 border-zinc-850 text-sm focus-visible:ring-zinc-700 placeholder:text-zinc-600 min-h-[70px]"
              />
            </div>

            {/* Product Mapping List */}
            {selectedClientId && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-zinc-500" /> Link Catalog Products
                </label>
                {loadingProducts ? (
                  <div className="text-zinc-500 text-xs py-1">Loading client catalog...</div>
                ) : products.length === 0 ? (
                  <span className="text-zinc-600 text-xs block bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                    No active catalog products found for this client. Create catalog items under Products first.
                  </span>
                ) : (
                  <div className="max-h-40 overflow-y-auto divide-y divide-zinc-900 bg-zinc-950 border border-zinc-850 rounded-lg p-2 space-y-1 scrollbar-thin">
                    {products.map((p) => {
                      const isLinked = selectedProducts.includes(p.id);
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => handleProductToggle(p.id)}
                          className="w-full flex items-center justify-between p-2 hover:bg-zinc-900 rounded-md text-xs font-medium text-zinc-300 transition-colors"
                        >
                          <span>{p.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${
                              isLinked
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                : "bg-zinc-900 text-zinc-500 border-zinc-800"
                            }`}
                          >
                            {isLinked ? "Linked" : "Link"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Action Buttons */}
          <SheetFooter className="p-4 bg-zinc-950 border-t border-zinc-850 flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs px-4 h-9 shadow-lg shadow-emerald-500/10 flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditMode ? "Save Changes" : "Create Item"}</span>
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
