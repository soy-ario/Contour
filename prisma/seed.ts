import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { Platform, ClientStatus, PaymentStatus, ContentStatus, ContentType, ApprovalAction, ProductStatus } from "@prisma/client";

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data in dependency order
  await prisma.syncLog.deleteMany({});
  await prisma.requestComment.deleteMany({});
  await prisma.request.deleteMany({});
  await prisma.internalNote.deleteMany({});
  await prisma.reportSection.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.healthScoreLog.deleteMany({});
  await prisma.platformDailyMetric.deleteMany({});
  await prisma.contentAnalytic.deleteMany({});
  await prisma.statusLog.deleteMany({});
  await prisma.approvalEvent.deleteMany({});
  await prisma.contentProduct.deleteMany({});
  await prisma.content.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.analyticsSnapshot.deleteMany({});
  await prisma.socialAccount.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.twoFactor.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.client.deleteMany({});

  console.log("🧹 Database cleared.");

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash("admin1234!", 12);
  const clientPasswordHash = await bcrypt.hash("demo1234!", 12);

  // 1. Create Admin User
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@contour.com",
      name: "Admin User",
      emailVerified: true,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      accounts: {
        create: {
          accountId: "admin@contour.com",
          providerId: "credential",
          password: adminPasswordHash,
        },
      },
    },
  });
  console.log(`👤 Created Admin User: ${admin.username}`);

  // 2. Define Client specifications
  const clientSpecs = [
    {
      brandName: "Demo Client",
      contactName: "Sarah Connor",
      contactEmail: "sarah@democlient.com",
      status: ClientStatus.ACTIVE,
      monthlyRetainer: 6500.00,
      monthlyBudget: 1500.00,
      amountPaid: 6500.00,
      paymentStatus: PaymentStatus.PAID,
      username: "demo_client",
      email: "demo_client@contour.com",
    },
    {
      brandName: "Acme Corporation",
      contactName: "Wile E. Coyote",
      contactEmail: "wile@acme.com",
      status: ClientStatus.ACTIVE,
      monthlyRetainer: 4500.00,
      monthlyBudget: 800.00,
      amountPaid: 4500.00,
      paymentStatus: PaymentStatus.PAID,
      username: "acme_client",
      email: "acme@contour.com",
    },
    {
      brandName: "Stark Industries",
      contactName: "Pepper Potts",
      contactEmail: "pepper@stark.com",
      status: ClientStatus.ACTIVE,
      monthlyRetainer: 12000.00,
      monthlyBudget: 5000.00,
      amountPaid: 6000.00,
      paymentStatus: PaymentStatus.PARTIAL,
      username: "stark_client",
      email: "stark@contour.com",
    }
  ];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  for (const spec of clientSpecs) {
    // Create Client
    const client = await prisma.client.create({
      data: {
        brandName: spec.brandName,
        contactName: spec.contactName,
        contactEmail: spec.contactEmail,
        status: spec.status,
        monthlyRetainer: spec.monthlyRetainer,
        monthlyBudget: spec.monthlyBudget,
        amountPaid: spec.amountPaid,
        paymentStatus: spec.paymentStatus,
        marketingTheme: "Modern Minimalist",
        contractStart: new Date(now.getFullYear(), now.getMonth() - 6, 1),
        contractEnd: new Date(now.getFullYear(), now.getMonth() + 6, 1),
        healthScore: 88,
      },
    });

    // Create associated user account
    const user = await prisma.user.create({
      data: {
        username: spec.username,
        email: spec.email,
        name: spec.contactName,
        emailVerified: true,
        passwordHash: clientPasswordHash,
        role: "CLIENT",
        clientId: client.id,
        accounts: {
          create: {
            accountId: spec.email,
            providerId: "credential",
            password: clientPasswordHash,
          },
        },
      },
    });

    console.log(`🏢 Created Client: ${client.brandName} with User: ${user.username}`);

    // Create Social Accounts
    const platforms = [Platform.INSTAGRAM, Platform.FACEBOOK, Platform.LINKEDIN, Platform.TIKTOK, Platform.YOUTUBE];
    for (const p of platforms) {
      await prisma.socialAccount.create({
        data: {
          clientId: client.id,
          platform: p,
          accountId: `${client.brandName.toLowerCase().replace(/\s+/g, "_")}_${p.toLowerCase()}`,
          accountName: `@${client.brandName.replace(/\s+/g, "")}`,
          accessTokenEnc: "encrypted_access_token_token",
          status: "CONNECTED",
          lastSyncAt: new Date(),
        },
      });
    }

    // Create Products
    const products = [];
    const productNames = ["Elite Package", "Standard Subscription", "Add-on Starter Pack"];
    for (const name of productNames) {
      const prod = await prisma.product.create({
        data: {
          clientId: client.id,
          name,
          category: "Services",
          description: `Core service package: ${name} for marketing campaigns.`,
          price: 249.99,
          status: ProductStatus.ACTIVE,
        },
      });
      products.push(prod);
    }

    // Create Content, Analytics, and Attribution
    const topics = ["Product Launch", "Feature Spotlight", "Customer Testimonial", "Seasonal Promo", "Behind the Scenes"];
    const contentTypes = [ContentType.REEL, ContentType.POST, ContentType.STORY, ContentType.VIDEO, ContentType.CAROUSEL];

    for (let i = 0; i < 15; i++) {
      const pubDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 2));
      const status = i < 8 ? ContentStatus.POSTED : i < 12 ? ContentStatus.SCHEDULED : ContentStatus.CLIENT_APPROVAL_PENDING;

      const c = await prisma.content.create({
        data: {
          clientId: client.id,
          title: `Campaign Update ${i + 1}`,
          topic: topics[i % topics.length],
          platform: platforms[i % platforms.length],
          contentType: contentTypes[i % contentTypes.length],
          status,
          caption: `Discover our latest updates! Promoted products linked in bio. #${client.brandName.replace(/\s+/g, "")}`,
          publishDate: status === ContentStatus.POSTED ? pubDate : null,
          scheduledAt: status === ContentStatus.SCHEDULED ? pubDate : null,
          adSpend: (i * 45) + 20,
          createdBy: admin.id,
        },
      });

      // Link to a product
      const productToLink = products[i % products.length];
      await prisma.contentProduct.create({
        data: {
          contentId: c.id,
          productId: productToLink.id,
        },
      });

      // Create Analytics if posted
      if (status === ContentStatus.POSTED) {
        const views = BigInt(1500 + i * 250);
        const reach = BigInt(1000 + i * 180);
        const impressions = BigInt(1200 + i * 220);
        const likes = 80 + i * 15;
        const comments = 12 + i * 3;
        const shares = 8 + i * 2;
        const saves = 15 + i * 4;
        const engagementRate = reach > 0 ? (likes + comments + shares + saves) / Number(reach) : 0;

        await prisma.contentAnalytic.create({
          data: {
            contentId: c.id,
            views,
            reach,
            impressions,
            likes,
            comments,
            shares,
            saves,
            engagementRate,
            lastSyncedAt: new Date(),
          },
        });
      }

      // Create workflow approval events
      await prisma.approvalEvent.create({
        data: {
          contentId: c.id,
          action: i < 12 ? ApprovalAction.APPROVED : ApprovalAction.SUBMITTED,
          comment: i < 12 ? "Looks amazing, approved for schedule!" : "Awaiting your feedback on creative copy.",
          actorId: i < 12 ? user.id : admin.id,
        },
      });
    }

    // Daily Metrics (Past 60 days)
    for (let dayOffset = 60; dayOffset >= 0; dayOffset--) {
      const metricDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset);

      for (const p of platforms) {
        const factor = dayOffset % 5 + 1;
        await prisma.platformDailyMetric.create({
          data: {
            clientId: client.id,
            platform: p,
            metricDate,
            views: BigInt(500 * factor + dayOffset * 5),
            reach: BigInt(350 * factor + dayOffset * 4),
            impressions: BigInt(450 * factor + dayOffset * 6),
            engagement: BigInt(45 * factor + dayOffset),
            likes: BigInt(35 * factor),
            comments: BigInt(6 * factor),
            shares: BigInt(3 * factor),
            saves: BigInt(1 * factor),
            followerDelta: factor - 2,
          },
        });
      }
    }

    // Monthly Snapshots (Current and Previous Month)
    const months = [
      { start: startOfMonth, end: endOfMonth, suffix: "Current" },
      {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0),
        suffix: "Prev",
      },
    ];

    for (const m of months) {
      for (const p of platforms) {
        await prisma.analyticsSnapshot.create({
          data: {
            clientId: client.id,
            platform: p,
            periodStart: m.start,
            periodEnd: m.end,
            totalViews: BigInt(p === Platform.INSTAGRAM ? 15000 : 8000),
            totalReach: BigInt(p === Platform.INSTAGRAM ? 12000 : 6000),
            totalImpressions: BigInt(p === Platform.INSTAGRAM ? 14000 : 7000),
            totalEngagement: BigInt(p === Platform.INSTAGRAM ? 1200 : 500),
            totalLikes: BigInt(p === Platform.INSTAGRAM ? 800 : 350),
            totalComments: BigInt(p === Platform.INSTAGRAM ? 150 : 70),
            totalShares: BigInt(p === Platform.INSTAGRAM ? 100 : 40),
            totalSaves: BigInt(p === Platform.INSTAGRAM ? 150 : 40),
            followerGrowth: p === Platform.INSTAGRAM ? 85 : 30,
            postCount: 5,
            storyCount: 12,
            reelCount: 4,
          },
        });
      }
    }

    // Create Client Requests, Comments, and Internal Notes
    const request = await prisma.request.create({
      data: {
        clientId: client.id,
        title: "Update Instagram Cover Photo",
        body: "Can we replace the current IG bio banner with the brand relaunch creative assets?",
        status: "OPEN",
      },
    });

    await prisma.requestComment.create({
      data: {
        requestId: request.id,
        authorId: user.id,
        body: "Adding the links to assets: brand-assets.co/banner",
      },
    });

    await prisma.requestComment.create({
      data: {
        requestId: request.id,
        authorId: admin.id,
        body: "Got it! Our design team is adapting this to the required aspect ratio.",
      },
    });

    await prisma.internalNote.create({
      data: {
        clientId: client.id,
        content: "Client prefers high-saturation imagery. Avoid muted pastel colors. Prefers reports on Monday mornings.",
        createdBy: admin.id,
      },
    });
  }

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
