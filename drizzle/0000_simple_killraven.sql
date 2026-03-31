-- Create invitations table
CREATE TABLE IF NOT EXISTS "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"inviter_user_id" text NOT NULL,
	"invitee_email" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	CONSTRAINT "invitations_list_id_invitee_email_unique" UNIQUE("list_id","invitee_email")
);
--> statement-breakpoint
-- Create list_members table
CREATE TABLE IF NOT EXISTS "list_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "list_members_list_id_user_id_unique" UNIQUE("list_id","user_id")
);
--> statement-breakpoint
-- Add added_by column to list_items if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'list_items' AND column_name = 'added_by'
  ) THEN
    ALTER TABLE "list_items" ADD COLUMN "added_by" text DEFAULT 'unknown' NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
-- Add foreign key constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invitations_list_id_lists_id_fk'
  ) THEN
    ALTER TABLE "invitations" ADD CONSTRAINT "invitations_list_id_lists_id_fk" 
    FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'list_members_list_id_lists_id_fk'
  ) THEN
    ALTER TABLE "list_members" ADD CONSTRAINT "list_members_list_id_lists_id_fk" 
    FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_invitations_invitee_email" ON "invitations"("invitee_email");
CREATE INDEX IF NOT EXISTS "idx_invitations_list_id" ON "invitations"("list_id");
CREATE INDEX IF NOT EXISTS "idx_invitations_status" ON "invitations"("status");
CREATE INDEX IF NOT EXISTS "idx_list_members_user_id" ON "list_members"("user_id");
CREATE INDEX IF NOT EXISTS "idx_list_members_list_id" ON "list_members"("list_id");
CREATE INDEX IF NOT EXISTS "idx_list_items_added_by" ON "list_items"("added_by");
--> statement-breakpoint
-- Data migration: Populate list_members for existing lists
INSERT INTO "list_members" ("list_id", "user_id", "role", "joined_at")
SELECT "id", "user_id", 'owner', "created_at"
FROM "lists"
ON CONFLICT ("list_id", "user_id") DO NOTHING;