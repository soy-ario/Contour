import { notFound } from "next/navigation";
import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ContentDetailComponent from "@/components/features/client/content-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ClientContentDetailPage({ params }: PageProps) {
  const user = await requireClient();
  const { id } = await params;

  const content = await prisma.content.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          brandName: true,
        },
      },
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              price: true,
            },
          },
        },
      },
      approvalEvents: {
        orderBy: { createdAt: "desc" },
        include: {
          actor: {
            select: {
              name: true,
              username: true,
            },
          },
        },
      },
    },
  });

  if (!content) {
    notFound();
  }

  // Cross-client isolation check
  if (content.clientId !== user.clientId) {
    notFound();
  }

  // Transform products relation from join table format to direct array
  const transformedContent = {
    ...content,
    adSpend: content.adSpend ? Number(content.adSpend) : null,
    products: content.products.map((cp) => ({
      id: cp.product.id,
      name: cp.product.name,
      category: cp.product.category,
      price: cp.product.price ? Number(cp.product.price) : null,
    })),
  };

  return <ContentDetailComponent content={transformedContent} />;
}
