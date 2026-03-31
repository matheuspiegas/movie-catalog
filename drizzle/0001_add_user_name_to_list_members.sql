ALTER TABLE "list_members" ADD COLUMN IF NOT EXISTS "user_name" text;
--> statement-breakpoint
UPDATE "list_members"
SET "user_name" = "user_id"
WHERE "user_name" IS NULL;
--> statement-breakpoint
ALTER TABLE "list_members" ALTER COLUMN "user_name" SET NOT NULL;
