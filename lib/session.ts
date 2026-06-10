import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { SessionUser } from "@/types";
import { prisma } from "@/lib/prisma";

/**
 * Server-side session getter — use in Server Components and Server Actions.
 * Throws if no valid session exists.
 */
export async function getRequiredSession(): Promise<{
  user: SessionUser;
  session: { id: string; expiresAt: Date };
}> {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session) {
    throw new Error("Unauthorized — no valid session");
  }

  // Enrich with clientId from the database user record
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, clientId: true, username: true },
  });

  if (!dbUser) {
    throw new Error("Unauthorized — user not found");
  }

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      username: dbUser.username,
      role: dbUser.role,
      clientId: dbUser.clientId,
    },
    session: {
      id: session.session.id,
      expiresAt: session.session.expiresAt,
    },
  };
}

/**
 * Asserts that the current user is an ADMIN.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const { user } = await getRequiredSession();
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden — admin access required");
  }
  return user;
}

/**
 * Asserts that the current user is a CLIENT and returns their clientId.
 */
export async function requireClient(): Promise<SessionUser & { clientId: string }> {
  const { user } = await getRequiredSession();
  if (user.role !== "CLIENT" || !user.clientId) {
    throw new Error("Forbidden — client access required");
  }
  return user as SessionUser & { clientId: string };
}

/**
 * Asserts that the given clientId matches the session user's clientId.
 * Used to prevent cross-client data access.
 */
export async function assertClientOwnership(clientId: string): Promise<void> {
  const { user } = await getRequiredSession();
  if (user.role === "ADMIN") return; // Admin has access to all clients
  if (user.clientId !== clientId) {
    throw new Error("Forbidden — cross-client access denied");
  }
}
