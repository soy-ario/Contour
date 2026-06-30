# Contr. Platform — Agency Operations & Client Analytics Portal

Contr. is a centralized agency operating system designed to streamline client management, creative content workflows, social media analytics synchronization, and client-agency collaboration. Built on a modern server-actions-driven Next.js architecture, Contr. provides a premium administrative panel for agency owners and a dedicated, isolated portal for clients.

---

## 🚀 Key Feature Set

### 🛡️ Administrative Panel (Admins Only)
- **Client Portfolio Management**: Track client onboarding status through a structured pipeline (`LEAD` ➔ `DISCOVERY` ➔ `PROPOSAL_SENT` ➔ `CONTRACT_SIGNED` ➔ `SETUP` ➔ `DASHBOARD_READY` ➔ `ACTIVE`).
- **Dynamic Client Health Score**: Automatically calculates a monthly 0–100 health score using key indicators: reach trends, engagement rates, content posting consistency, and approval cycle delays.
- **Content Operations & Calendar**: Create, edit, draft, schedule, and publish platform-specific content items with ad spend tracking. Features visual list and grid calendar views.
- **Programmatic Reports & AI Summarizer**: Generate monthly performance reports enriched with automatic Executive Summaries powered by Google's Gemini 3.5 Flash model.
- **Internal Knowledge & Strategy**: Capture private client strategy logs and internal operational notes.

### 💼 Client Portal (Client Scope)
- **KPI Performance Dashboard**: Real-time campaign tracking showing views, reach, total engagement, ad budget utilization, and promoted product metrics.
- **Interactive Content Review Pipeline**: Directly approve, reject, or request changes on upcoming social media copy. Include optional or required feedback notes.
- **Operations Requests & Discussion Threads**: Create operations support tickets (e.g. asset updates, concept adjustments) and discuss implementation details in live, chronological chat feeds.
- **Product Attribution Catalog**: Manage products linked directly to active campaigns to analyze reach and attributed performance.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Database ORM**: [Prisma ORM](https://www.prisma.io/)
- **Database Hosting**: [Neon Serverless PostgreSQL](https://neon.tech/)
- **Authentication**: [Better Auth](https://www.better-auth.com/) (Role-based JWT session security, credential provider)
- **Aesthetics & UI**: Tailwind CSS, `@base-ui/react`, Radix UI primitives, Lucide Icons, and customized status badges.
- **Data Visualization**: Recharts (Responsive Line, Area, and Bar Chart wrappers)
- **AI Integrations**: Google Gemini 3.5 Flash API (REST fetch integration)
- **Outbound Email**: Resend API (Transactional workflows: approvals, rejections, change requests)
- **Object Storage**: Supabase Storage (Current MVP) / Cloudflare R2 (Supported migration provider)

---

## 📁 Repository Structure

```text
├── app/                  # Next.js App Router (Layouts, Pages, APIs)
│   ├── (admin)/          # Admin-only dashboard, client views, and settings
│   ├── (client)/         # Client portal layout, content review, and operations tickets
│   ├── api/              # Internal API endpoints (auth, clients, social-sync, status)
│   └── login/            # Combined credentials authentication screen
├── components/           # Reusable React components
│   ├── charts/           # Recharts visualization wrappers
│   ├── features/         # Feature-specific modules (calendar, queue, forms, sheets)
│   ├── layout/           # Sidebar, Topbar, page wrapper structures
│   ├── shared/           # Design system tokens (badges, rings, stat cards)
│   └── ui/               # Lower-level Base UI primitive components
├── lib/                  # Application utility functions and core business logic
│   ├── actions/          # Next.js Server Actions (crud, approvals, reports)
│   ├── services/         # Services (analytics, health-score, resend email, audit logs)
│   ├── validations/      # Zod validation schemas for forms and API validation
│   ├── ai.ts             # Gemini 3.5 Flash API connector
│   └── auth.ts           # Better Auth server configuration
└── prisma/               # Database migrations and seed scripts
```

---

## 💻 Local Setup & Development

### 1. Prerequisites
- **Node.js**: `v20.x` or later
- **PostgreSQL**: A local instance or a cloud-hosted Neon database URL.

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/contour"
DATABASE_URL_UNPOOLED="postgresql://username:password@localhost:5432/contour"

# Better Auth
BETTER_AUTH_SECRET="your-32-character-random-secret"
BETTER_AUTH_URL="http://localhost:3000"

# Google Gemini API
GEMINI_API_KEY="your-google-ai-studio-api-key"

# Outbound Email (Resend)
RESEND_API_KEY="re_your-resend-api-key"

# Storage Configuration
STORAGE_PROVIDER="SUPABASE" # or "R2"

# Supabase Storage (Current MVP)
SUPABASE_URL="https://your-supabase-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_BUCKET_NAME="contour-assets"

# Cloudflare R2 (Future implementation)
R2_ACCOUNT_ID="your-r2-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="contour-assets"
R2_PUBLIC_URL="https://pub-your-bucket-id.r2.dev"

# Crypto & Security
TOKEN_ENCRYPTION_KEY="your-32-character-hexadecimal-key"
CRON_SECRET="your-scheduler-cron-secret-token"
```

### 4. Database Setup & Migrations
Synchronize your database schema and run the seed script to create the initial administrative logins and campaign data:
```bash
# Push schema migrations
npx prisma db push

# Seed database
npm run prisma:seed
```

### 5. Running the Application
Launch the local dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your browser to view the application.

---

## 🚀 Live Production Deployment

### 1. Neon Database Setup
1. Log in to [Neon.tech](https://neon.tech/) and provision a new database.
2. Store the **Pooled Connection URL** (for `DATABASE_URL`) and the **Unpooled Connection URL** (for `DATABASE_URL_UNPOOLED`).

### 2. Vercel Deployment
1. Import the project repository into your [Vercel Dashboard](https://vercel.com).
2. Configure all environment variables listed in the **Environment Configuration** section. Ensure `BETTER_AUTH_URL` is set to your production domain (e.g., `https://your-domain.vercel.app`).
3. Click **Deploy**.

### 3. Scheduled Sync Jobs (Crons)
The social sync logs run on a daily schedule. Configure Vercel native crons via the `vercel.json` file in the root, or configure an external webhook scheduler targeting `/api/sync-all`. Authenticate scheduled requests using `Bearer <CRON_SECRET>`.
