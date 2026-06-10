import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh if >1 day old
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 min client-side cache
    },
  },

  emailAndPassword: {
    enabled: true,
  },

  plugins: [
    twoFactor({
      issuer: "Contour",
      otpOptions: {
        period: 30,
        digits: 6,
      },
    }),
  ],

  rateLimit: {
    window: 60,
    max: 5,
    storage: "database",
  },

  advanced: {
    cookiePrefix: "contour",
  },
});

export type Session = typeof auth.$Infer.Session;
