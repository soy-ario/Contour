import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductCatalogManager, { ProductWithAttribution } from "@/components/features/admin/product-catalog-manager";

export const dynamic = "force-dynamic";

interface ProductsPageProps {
  params: Promise<{ id: string }>;
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

  // Convert Decimals to numbers for client component parsing
  const serializedProducts = products.map((product) => ({
    ...product,
    price: product.price ? Number(product.price) : null,
    contents: product.contents.map((cp) => ({
      ...cp,
      content: {
        ...cp.content,
        analytics: cp.content.analytics
          ? {
              ...cp.content.analytics,
              reach: cp.content.analytics.reach ? Number(cp.content.analytics.reach) : 0,
              likes: cp.content.analytics.likes ? Number(cp.content.analytics.likes) : 0,
              comments: cp.content.analytics.comments ? Number(cp.content.analytics.comments) : 0,
              shares: cp.content.analytics.shares ? Number(cp.content.analytics.shares) : 0,
              saves: cp.content.analytics.saves ? Number(cp.content.analytics.saves) : 0,
              engagementRate: cp.content.analytics.engagementRate
                ? Number(cp.content.analytics.engagementRate)
                : 0,
            }
          : null,
      },
    })),
  })) as unknown as ProductWithAttribution[];

  return (
    <div className="px-8 py-8 max-w-[1440px] mx-auto w-full space-y-6">
      <ProductCatalogManager
        initialProducts={serializedProducts}
        clientId={client.id}
        brandName={client.brandName}
      />
    </div>
  );
}
