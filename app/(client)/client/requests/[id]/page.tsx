import { notFound } from "next/navigation";
import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import RequestThread from "@/components/features/client/request-thread";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ClientRequestDetailPage({ params }: PageProps) {
  const user = await requireClient();
  const { id } = await params;

  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: {
              name: true,
              username: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!request) {
    notFound();
  }

  // Cross-client isolation check
  if (request.clientId !== user.clientId) {
    notFound();
  }

  return <RequestThread request={request} currentUserId={user.id} />;
}
