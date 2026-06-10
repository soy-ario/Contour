-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CLIENT');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('LEAD', 'DISCOVERY', 'PROPOSAL_SENT', 'CONTRACT_SIGNED', 'SETUP', 'DASHBOARD_READY', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'PARTIAL');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'TIKTOK', 'YOUTUBE', 'X');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'TOKEN_EXPIRED', 'ERROR');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('REEL', 'POST', 'STORY', 'VIDEO', 'CAROUSEL', 'THREAD', 'SHORT', 'LIVE');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('IDEA', 'DRAFT', 'CLIENT_APPROVAL_PENDING', 'APPROVED', 'SCHEDULED', 'POSTED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'COMMENTED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('GENERATING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('STARTED', 'SUCCESS', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "client_id" TEXT,
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "mfa_secret" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "brand_name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "logo_url" TEXT,
    "description" TEXT,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "monthly_retainer" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amount_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "contract_start" DATE,
    "contract_end" DATE,
    "marketing_theme" TEXT,
    "monthly_budget" DECIMAL(12,2),
    "status" "ClientStatus" NOT NULL DEFAULT 'LEAD',
    "health_score" INTEGER,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_accounts" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "account_id" TEXT NOT NULL,
    "account_name" TEXT,
    "access_token_enc" TEXT NOT NULL,
    "refresh_token_enc" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
    "last_sync_at" TIMESTAMP(3),
    "sync_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contents" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT,
    "platform" "Platform" NOT NULL,
    "content_type" "ContentType" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'IDEA',
    "caption" TEXT,
    "script" TEXT,
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "asset_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publish_date" DATE,
    "scheduled_at" TIMESTAMP(3),
    "posted_at" TIMESTAMP(3),
    "ad_spend" DECIMAL(12,2),
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_products" (
    "content_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_products_pkey" PRIMARY KEY ("content_id","product_id")
);

-- CreateTable
CREATE TABLE "approval_events" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "action" "ApprovalAction" NOT NULL,
    "comment" TEXT,
    "actor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_logs" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "from_status" "ContentStatus",
    "to_status" "ContentStatus" NOT NULL,
    "changed_by" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "price" DECIMAL(12,2),
    "url" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "total_views" BIGINT NOT NULL DEFAULT 0,
    "total_reach" BIGINT NOT NULL DEFAULT 0,
    "total_impressions" BIGINT NOT NULL DEFAULT 0,
    "total_engagement" BIGINT NOT NULL DEFAULT 0,
    "total_likes" BIGINT NOT NULL DEFAULT 0,
    "total_comments" BIGINT NOT NULL DEFAULT 0,
    "total_shares" BIGINT NOT NULL DEFAULT 0,
    "total_saves" BIGINT NOT NULL DEFAULT 0,
    "follower_count_start" BIGINT,
    "follower_count_end" BIGINT,
    "follower_growth" INTEGER NOT NULL DEFAULT 0,
    "video_views" BIGINT NOT NULL DEFAULT 0,
    "watch_time_seconds" BIGINT NOT NULL DEFAULT 0,
    "avg_engagement_rate" DECIMAL(8,4),
    "avg_ctr" DECIMAL(8,4),
    "post_count" INTEGER NOT NULL DEFAULT 0,
    "story_count" INTEGER NOT NULL DEFAULT 0,
    "reel_count" INTEGER NOT NULL DEFAULT 0,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_payload" JSONB,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_analytics" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "views" BIGINT NOT NULL DEFAULT 0,
    "reach" BIGINT NOT NULL DEFAULT 0,
    "impressions" BIGINT NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "engagement_rate" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "video_views" BIGINT NOT NULL DEFAULT 0,
    "watch_time_secs" BIGINT NOT NULL DEFAULT 0,
    "avg_watch_pct" DECIMAL(5,2),
    "ctr" DECIMAL(8,4),
    "native_post_id" TEXT,
    "permalink" TEXT,
    "last_synced_at" TIMESTAMP(3),

    CONSTRAINT "content_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_daily_metrics" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "metric_date" DATE NOT NULL,
    "views" BIGINT NOT NULL DEFAULT 0,
    "reach" BIGINT NOT NULL DEFAULT 0,
    "impressions" BIGINT NOT NULL DEFAULT 0,
    "engagement" BIGINT NOT NULL DEFAULT 0,
    "likes" BIGINT NOT NULL DEFAULT 0,
    "comments" BIGINT NOT NULL DEFAULT 0,
    "shares" BIGINT NOT NULL DEFAULT 0,
    "saves" BIGINT NOT NULL DEFAULT 0,
    "follower_delta" INTEGER NOT NULL DEFAULT 0,
    "video_views" BIGINT NOT NULL DEFAULT 0,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_score_logs" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "engagement_component" INTEGER NOT NULL,
    "reach_component" INTEGER NOT NULL,
    "consistency_component" INTEGER NOT NULL,
    "approval_component" INTEGER NOT NULL,
    "growth_component" INTEGER NOT NULL,
    "period_month" INTEGER NOT NULL,
    "period_year" INTEGER NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_score_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'GENERATING',
    "data_snapshot" JSONB NOT NULL DEFAULT '{}',
    "ai_summary" TEXT,
    "ai_recommendations" JSONB,
    "pdf_r2_key" TEXT,
    "generated_by" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_sections" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_comments" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "author_id" TEXT,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "request_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_notes" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "before_snapshot" JSONB,
    "after_snapshot" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "request_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'STARTED',
    "records_synced" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_client_id_key" ON "users"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_key" ON "sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "verification_tokens_identifier_idx" ON "verification_tokens"("identifier");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE INDEX "clients_payment_status_idx" ON "clients"("payment_status");

-- CreateIndex
CREATE INDEX "clients_health_score_idx" ON "clients"("health_score" DESC);

-- CreateIndex
CREATE INDEX "social_accounts_platform_idx" ON "social_accounts"("platform");

-- CreateIndex
CREATE INDEX "social_accounts_status_idx" ON "social_accounts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "social_accounts_client_id_platform_key" ON "social_accounts"("client_id", "platform");

-- CreateIndex
CREATE INDEX "contents_client_id_status_idx" ON "contents"("client_id", "status");

-- CreateIndex
CREATE INDEX "contents_client_id_platform_idx" ON "contents"("client_id", "platform");

-- CreateIndex
CREATE INDEX "contents_client_id_scheduled_at_idx" ON "contents"("client_id", "scheduled_at" DESC);

-- CreateIndex
CREATE INDEX "contents_status_idx" ON "contents"("status");

-- CreateIndex
CREATE INDEX "contents_scheduled_at_idx" ON "contents"("scheduled_at");

-- CreateIndex
CREATE INDEX "content_products_product_id_idx" ON "content_products"("product_id");

-- CreateIndex
CREATE INDEX "approval_events_content_id_idx" ON "approval_events"("content_id");

-- CreateIndex
CREATE INDEX "approval_events_actor_id_idx" ON "approval_events"("actor_id");

-- CreateIndex
CREATE INDEX "approval_events_created_at_idx" ON "approval_events"("created_at" DESC);

-- CreateIndex
CREATE INDEX "status_logs_content_id_idx" ON "status_logs"("content_id");

-- CreateIndex
CREATE INDEX "status_logs_created_at_idx" ON "status_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "products_client_id_status_idx" ON "products"("client_id", "status");

-- CreateIndex
CREATE INDEX "products_client_id_category_idx" ON "products"("client_id", "category");

-- CreateIndex
CREATE INDEX "analytics_snapshots_client_id_platform_period_start_idx" ON "analytics_snapshots"("client_id", "platform", "period_start" DESC);

-- CreateIndex
CREATE INDEX "analytics_snapshots_client_id_period_start_idx" ON "analytics_snapshots"("client_id", "period_start" DESC);

-- CreateIndex
CREATE INDEX "analytics_snapshots_platform_period_start_idx" ON "analytics_snapshots"("platform", "period_start" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "analytics_snapshots_client_id_platform_period_start_period__key" ON "analytics_snapshots"("client_id", "platform", "period_start", "period_end");

-- CreateIndex
CREATE UNIQUE INDEX "content_analytics_content_id_key" ON "content_analytics"("content_id");

-- CreateIndex
CREATE INDEX "content_analytics_engagement_rate_idx" ON "content_analytics"("engagement_rate" DESC);

-- CreateIndex
CREATE INDEX "content_analytics_reach_idx" ON "content_analytics"("reach" DESC);

-- CreateIndex
CREATE INDEX "content_analytics_views_idx" ON "content_analytics"("views" DESC);

-- CreateIndex
CREATE INDEX "platform_daily_metrics_client_id_platform_metric_date_idx" ON "platform_daily_metrics"("client_id", "platform", "metric_date" DESC);

-- CreateIndex
CREATE INDEX "platform_daily_metrics_client_id_metric_date_idx" ON "platform_daily_metrics"("client_id", "metric_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "platform_daily_metrics_client_id_platform_metric_date_key" ON "platform_daily_metrics"("client_id", "platform", "metric_date");

-- CreateIndex
CREATE INDEX "health_score_logs_client_id_period_year_period_month_idx" ON "health_score_logs"("client_id", "period_year" DESC, "period_month" DESC);

-- CreateIndex
CREATE INDEX "reports_client_id_created_at_idx" ON "reports"("client_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "reports_client_id_month_year_key" ON "reports"("client_id", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "report_sections_report_id_section_key" ON "report_sections"("report_id", "section");

-- CreateIndex
CREATE INDEX "requests_client_id_created_at_idx" ON "requests"("client_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "requests_client_id_status_idx" ON "requests"("client_id", "status");

-- CreateIndex
CREATE INDEX "request_comments_request_id_created_at_idx" ON "request_comments"("request_id", "created_at" ASC);

-- CreateIndex
CREATE INDEX "internal_notes_client_id_created_at_idx" ON "internal_notes"("client_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "sync_logs_client_id_platform_started_at_idx" ON "sync_logs"("client_id", "platform", "started_at" DESC);

-- CreateIndex
CREATE INDEX "sync_logs_status_started_at_idx" ON "sync_logs"("status", "started_at" DESC);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_products" ADD CONSTRAINT "content_products_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_products" ADD CONSTRAINT "content_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_events" ADD CONSTRAINT "approval_events_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_events" ADD CONSTRAINT "approval_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_logs" ADD CONSTRAINT "status_logs_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_logs" ADD CONSTRAINT "status_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_analytics" ADD CONSTRAINT "content_analytics_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_daily_metrics" ADD CONSTRAINT "platform_daily_metrics_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_score_logs" ADD CONSTRAINT "health_score_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_sections" ADD CONSTRAINT "report_sections_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_comments" ADD CONSTRAINT "request_comments_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_comments" ADD CONSTRAINT "request_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
