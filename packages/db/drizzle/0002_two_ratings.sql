ALTER TABLE "agents" ADD COLUMN "upstream_stars" integer;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "upstream_stars_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "rating_avg" real;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "rating_count" integer DEFAULT 0 NOT NULL;
