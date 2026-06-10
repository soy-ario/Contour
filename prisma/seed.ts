import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing users/clients/accounts to prevent duplicate keys
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.client.deleteMany({});

  console.log("🧹 Existing database tables cleared.");

  // Hash passwords
  const adminPassword = "admin1234!";
  const clientPassword = "demo1234!";
  
  // Better Auth uses standard bcrypt hashes. We hash with 12 rounds.
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const clientPasswordHash = await bcrypt.hash(clientPassword, 12);

  // 1. Create Demo Client
  const client = await prisma.client.create({
    data: {
      brandName: "Demo Client",
      contactName: "Demo Contact",
      contactEmail: "demo@client.com",
      status: "ACTIVE",
      monthlyRetainer: 5000.00,
    },
  });
  console.log(`🏢 Created Demo Client: ${client.brandName} (${client.id})`);

  // 2. Create Admin User
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
  console.log(`👤 Created Admin User: ${admin.username} (${admin.email})`);

  // 3. Create Client User linked to Demo Client
  const clientUser = await prisma.user.create({
    data: {
      username: "demo_client",
      email: "demo_client@contour.com",
      name: "Demo Client User",
      emailVerified: true,
      passwordHash: clientPasswordHash,
      role: "CLIENT",
      clientId: client.id,
      accounts: {
        create: {
          accountId: "demo_client@contour.com",
          providerId: "credential",
          password: clientPasswordHash,
        },
      },
    },
  });
  console.log(`👤 Created Client User: ${clientUser.username} (${clientUser.email}) linked to ${client.brandName}`);

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
