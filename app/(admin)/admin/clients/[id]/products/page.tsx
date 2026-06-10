import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/shared/stat-card";
import StatusBadge from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/utils";

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
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totals = products.reduce(
    (sum, product) => {
      const reach = product.contents.reduce(
        (contentSum, item) => contentSum + Number(item.content.analytics?.reach ?? 0),
        0
      );
      return {
        promotedPosts: sum.promotedPosts + product.contents.length,
        reach: sum.reach + reach,
      };
    },
    { promotedPosts: 0, reach: 0 }
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Products</h1>
        <p className="text-sm text-muted-foreground">
          Product catalog and content attribution for {client.brandName}.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={products.length} />
        <StatCard label="Active Products" value={products.filter((product) => product.status === "ACTIVE").length} />
        <StatCard label="Promoting Posts" value={totals.promotedPosts} />
        <StatCard label="Attributed Reach" value={formatNumber(totals.reach)} />
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Catalog</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products have been added for this client.</p>
          ) : (
            products.map((product) => {
              const reach = product.contents.reduce(
                (sum, item) => sum + Number(item.content.analytics?.reach ?? 0),
                0
              );
              return (
                <div key={product.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-md border border-border/60 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category ?? "Uncategorized"}</p>
                  </div>
                  <StatusBadge status={product.status} />
                  <p className="text-sm text-muted-foreground">{product.price ? formatCurrency(Number(product.price)) : "-"}</p>
                  <p className="text-sm text-muted-foreground">{formatNumber(reach)} reach</p>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
