CREATE TABLE "daily_plans" (
	"date_key" text PRIMARY KEY NOT NULL,
	"amount" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text
);
