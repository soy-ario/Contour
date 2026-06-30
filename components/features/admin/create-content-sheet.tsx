"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import type { Platform, ContentType } from "@prisma/client";
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
import { createContentAction, updateContentAction } from "@/lib/actions/content.actions";
import { toast } from "sonner";
import { Loader2, Package } from "lucide-react";
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
  clientId?: string | null;
  contentIdToEdit?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

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

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedClientId = watch("clientId");
  const selectedPlatform = watch("platform");
  const selectedContentType = watch("contentType");
  const selectedProducts = watch("productIds") || [];

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

  React.useEffect(() => {
    if (open && selectedClientId) {
      setLoadingProducts(true);
      fetch(`/api/clients/${selectedClientId}/products`)
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            setProducts(res.data || []);
          } else {
            setProducts([]);
          }
        })
        .catch(() => {
          setProducts([]);
        })
        .finally(() => setLoadingProducts(false));
    } else {
      setProducts([]);
    }
  }, [open, selectedClientId]);

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
              productIds: item.products ? item.products.map((p: { id: string }) => p.id) : [],
            });
          }
        })
        .catch(() => toast.error("Failed to load content for editing"));
    }
  }, [open, isEditMode, contentIdToEdit, selectedClientId, reset]);

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
        result = await createContentAction({}, formattedData);
      }

      if (result.success) {
        toast.success(isEditMode ? "Content updated successfully!" : "Content idea created successfully!");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Operation failed");
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "An unexpected error occurred";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  function FormLabel({ children }: { children: React.ReactNode }) {
    return <label className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">{children}</label>;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto bg-white text-[#111827] p-0 flex flex-col h-full scrollbar-thin">
        <SheetHeader className="p-6 pb-4 border-b border-[#ECECF4] bg-[#FAFAFD]">
          <SheetTitle className="text-lg font-bold text-[#111827]">
            {isEditMode ? "Edit Content Details" : "Create Content Idea"}
          </SheetTitle>
          <SheetDescription className="text-xs text-[#6B7280]">
            {isEditMode
              ? "Update description, assets, and metadata for this content item."
              : "Draft a new content item. Created items will start in the 'Idea' stage."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 p-6 space-y-5 overflow-y-auto">
            {/* Client Selector */}
            {!clientId && !isEditMode && (
              <div className="space-y-1.5">
                <FormLabel>Client / Brand</FormLabel>
                {loadingClients ? (
                  <div className="flex items-center gap-2 text-[#6B7280] text-xs py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading clients...</span>
                  </div>
                ) : (
                  <Select
                    value={selectedClientId}
                    onValueChange={(val) => setValue("clientId", val || "")}
                  >
                    <SelectTrigger className="w-full border-[#ECECF4] bg-white text-sm text-[#111827] focus:ring-[#F2485A] rounded-xl h-10">
                      <SelectValue placeholder="Select a Client Brand" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#ECECF4] text-[#111827] rounded-xl">
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
              <FormLabel>Working Title</FormLabel>
              <Input
                placeholder="e.g. Summer Collection Launch Reel"
                {...register("title", { required: "Title is required" })}
                className="border-[#ECECF4] bg-white text-sm placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#F2485A] rounded-xl h-10"
              />
              {errors.title && (
                <span className="text-[10px] text-rose-500">{errors.title.message}</span>
              )}
            </div>

            {/* Topic */}
            <div className="space-y-1.5">
              <FormLabel>Topic / Concept Theme</FormLabel>
              <Input
                placeholder="e.g. Fashion, Behind the scenes, Q&A"
                {...register("topic")}
                className="border-[#ECECF4] bg-white text-sm placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#F2485A] rounded-xl h-10"
              />
            </div>

            {/* Platform & Content Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FormLabel>Platform</FormLabel>
                <Select
                  value={selectedPlatform}
                  onValueChange={(val) => setValue("platform", val as Platform)}
                >
                  <SelectTrigger className="w-full border-[#ECECF4] bg-white text-sm text-[#111827] focus:ring-[#F2485A] rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#ECECF4] text-[#111827] rounded-xl">
                    {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FormLabel>Content Type</FormLabel>
                <Select
                  value={selectedContentType}
                  onValueChange={(val) => setValue("contentType", val as ContentType)}
                >
                  <SelectTrigger className="w-full border-[#ECECF4] bg-white text-sm text-[#111827] focus:ring-[#F2485A] rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#ECECF4] text-[#111827] rounded-xl">
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
              <FormLabel>Caption / Copy</FormLabel>
              <Textarea
                placeholder="Write caption copy, call to actions, etc..."
                {...register("caption")}
                className="border-[#ECECF4] bg-white text-sm placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#F2485A] min-h-[100px] rounded-xl"
              />
            </div>

            {/* Script */}
            <div className="space-y-1.5">
              <FormLabel>Video Script / Hook / Notes</FormLabel>
              <Textarea
                placeholder="Hook: [text]\nBody: [text]\nCTA: [text]"
                {...register("script")}
                className="border-[#ECECF4] bg-white text-sm font-mono placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#F2485A] min-h-[120px] rounded-xl"
              />
            </div>

            {/* Hashtags */}
            <div className="space-y-1.5">
              <FormLabel>Hashtags (comma separated)</FormLabel>
              <Input
                placeholder="e.g. summerfashion, stylingtips, agency"
                {...register("hashtagsString")}
                className="border-[#ECECF4] bg-white text-sm placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#F2485A] rounded-xl h-10"
              />
            </div>

            {/* Asset URLs */}
            <div className="space-y-1.5">
              <FormLabel>Asset URLs (comma separated)</FormLabel>
              <Input
                placeholder="e.g. https://images.unsplash.com/photo-1, https://..."
                {...register("assetUrlsString")}
                className="border-[#ECECF4] bg-white text-sm placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#F2485A] rounded-xl h-10"
              />
              <span className="text-[10px] text-[#9CA3AF] block mt-1">
                Enter comma-separated public URLs. Full upload directly to R2 bucket will be integrated in Phase 9.
              </span>
            </div>

            {/* Ad Spend */}
            <div className="space-y-1.5">
              <FormLabel>Allocated Ad Spend Budget ($)</FormLabel>
              <Input
                type="number"
                min="0"
                placeholder="0"
                {...register("adSpend")}
                className="border-[#ECECF4] bg-white text-sm placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#F2485A] rounded-xl h-10"
              />
            </div>

            {/* Internal Notes */}
            <div className="space-y-1.5">
              <FormLabel>Internal Team Notes</FormLabel>
              <Textarea
                placeholder="Enter notes visible only to the agency team..."
                {...register("notes")}
                className="border-[#ECECF4] bg-white text-sm placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#F2485A] min-h-[70px] rounded-xl"
              />
            </div>

            {/* Product Mapping */}
            {selectedClientId && (
              <div className="space-y-2">
                <FormLabel><Package className="w-3 h-3 inline mr-1" />Link Catalog Products</FormLabel>
                {loadingProducts ? (
                  <div className="text-[#6B7280] text-xs py-1">Loading client catalog...</div>
                ) : products.length === 0 ? (
                  <span className="text-[#9CA3AF] text-xs block bg-white border border-[#ECECF4] p-2.5 rounded-lg">
                    No active catalog products found for this client. Create catalog items under Products first.
                  </span>
                ) : (
                  <div className="max-h-40 overflow-y-auto divide-y divide-[#ECECF4] bg-white border border-[#ECECF4] rounded-xl p-2 space-y-1 scrollbar-thin">
                    {products.map((p) => {
                      const isLinked = selectedProducts.includes(p.id);
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => handleProductToggle(p.id)}
                          className="w-full flex items-center justify-between p-2 hover:bg-[#FAFAFD] rounded-lg text-xs font-medium text-[#374151] transition-colors"
                        >
                          <span>{p.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${
                              isLinked
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : "bg-white text-[#6B7280] border-[#ECECF4]"
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

          <SheetFooter className="p-4 bg-[#FAFAFD] border-t border-[#ECECF4] flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold text-[#6B7280] hover:text-[#111827]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#1E1E2E] hover:bg-[#0E0E1E] text-white font-bold text-xs px-4 h-9 rounded-xl flex items-center gap-1.5"
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
