import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientProductsPage() {
  const user = await requireClient();

  const products = await prisma.product.findMany({
    where: { clientId: user.clientId },
    include: {
      contents: {
        include: {
          content: {
            include: {
              analytics: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Products</h1>
        <p className="text-sm text-muted-foreground">
          Products promoted through content and their attributed performance.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.length === 0 ? (
          <Card className="border-border bg-card md:col-span-2 xl:col-span-3">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No products have been added yet.
            </CardContent>
          </Card>
        ) : (
          products.map((product) => {
            const reach = product.contents.reduce(
              (sum, item) => sum + Number(item.content.analytics?.reach ?? 0),
              0
            );
            const engagement = product.contents.reduce(
              (sum, item) =>
                sum +
                Number(item.content.analytics?.likes ?? 0) +
                Number(item.content.analytics?.comments ?? 0) +
                Number(item.content.analytics?.shares ?? 0) +
                Number(item.content.analytics?.saves ?? 0),
              0
            );

            return (
              <Card key={product.id} className="border-border bg-card">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">{product.name}</CardTitle>
                    <StatusBadge status={product.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{product.category ?? "Uncategorized"}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {product.description ?? "No description provided."}
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="font-medium text-foreground">{product.price ? formatCurrency(Number(product.price)) : "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Posts</p>
                      <p className="font-medium text-foreground">{product.contents.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reach</p>
                      <p className="font-medium text-foreground">{formatNumber(reach)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatNumber(engagement)} total engagement</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
