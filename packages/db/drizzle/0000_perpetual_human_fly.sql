CREATE TABLE "agent_versions" (
	"agent_id" text NOT NULL,
	"version" text NOT NULL,
	"content_hash" text NOT NULL,
	"content_size_bytes" bigint NOT NULL,
	"manifest_url" text NOT NULL,
	"content_url" text NOT NULL,
	"changelog" text,
	"format" text NOT NULL,
	"price_cents" integer,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unpublished_at" timestamp with time zone,
	CONSTRAINT "agent_versions_agent_id_version_pk" PRIMARY KEY("agent_id","version")
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"long_description" text,
	"category" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"primary_format" text NOT NULL,
	"formats" text[] DEFAULT '{}'::text[] NOT NULL,
	"tool_compatibility" text[] DEFAULT '{}'::text[] NOT NULL,
	"license" text,
	"source_type" text NOT NULL,
	"source_url" text,
	"source_attribution" jsonb,
	"creator_id" uuid,
	"current_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unpublished_at" timestamp with time zone,
	"install_count_lifetime" bigint DEFAULT 0 NOT NULL,
	"install_count_30d" bigint DEFAULT 0 NOT NULL,
	"search_rank" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"version" text NOT NULL,
	"install_id" text,
	"user_id" uuid,
	"tool_detected" text,
	"format" text,
	"success" boolean NOT NULL,
	"error_code" text,
	"payment_intent_id" text,
	"user_agent" text,
	"ip_country" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" text NOT NULL,
	"reporter_user_id" uuid,
	"reporter_email" "citext",
	"reason" text NOT NULL,
	"details" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"resolved_by" uuid,
	"resolution_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" text NOT NULL,
	"source_type" text,
	"source_url" text,
	"agent_id" text,
	"creator_id" uuid,
	"reason" text NOT NULL,
	"requested_by" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" "citext" NOT NULL,
	"github_id" bigint,
	"github_login" text,
	"display_name" text,
	"avatar_url" text,
	"bio" text,
	"is_verified_publisher" boolean DEFAULT false NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"stripe_connect_account_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "verification_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"github_handle" text NOT NULL,
	"reasoning" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewer_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "agent_versions" ADD CONSTRAINT "agent_versions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installs" ADD CONSTRAINT "installs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_applications" ADD CONSTRAINT "verification_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_applications" ADD CONSTRAINT "verification_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_versions_published_idx" ON "agent_versions" USING btree ("agent_id","published_at");--> statement-breakpoint
CREATE INDEX "agents_search_rank_idx" ON "agents" USING btree ("search_rank");--> statement-breakpoint
CREATE INDEX "agents_creator_idx" ON "agents" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "agents_source_idx" ON "agents" USING btree ("source_type","source_url");--> statement-breakpoint
CREATE INDEX "agents_category_idx" ON "agents" USING btree ("category");--> statement-breakpoint
CREATE INDEX "installs_agent_idx" ON "installs" USING btree ("agent_id","created_at");--> statement-breakpoint
CREATE INDEX "installs_install_id_idx" ON "installs" USING btree ("install_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "suppressions_active_idx" ON "suppressions" USING btree ("status","scope");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_github_id_unique_idx" ON "users" USING btree ("github_id");--> statement-breakpoint
CREATE INDEX "verification_applications_user_idx" ON "verification_applications" USING btree ("user_id");