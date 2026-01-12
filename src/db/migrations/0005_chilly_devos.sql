CREATE TABLE "menu_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"display_order" integer DEFAULT 0,
	"is_active" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "areas" RENAME COLUMN "name" TO "name_en";--> statement-breakpoint
ALTER TABLE "branches" RENAME COLUMN "name" TO "name_ar";--> statement-breakpoint
ALTER TABLE "categories" RENAME COLUMN "name" TO "name_en";--> statement-breakpoint
ALTER TABLE "facilities" RENAME COLUMN "name" TO "name_en";--> statement-breakpoint
ALTER TABLE "restaurants" RENAME COLUMN "name" TO "name_en";--> statement-breakpoint
ALTER TABLE "restaurants" RENAME COLUMN "description" TO "description_en";--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "icon" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "areas" ADD COLUMN "name_ar" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "name_en" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "name_ar" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "description_ar" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "is_active" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "display_order" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "facilities" ADD COLUMN "name_ar" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "name_ar" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "description_ar" text;--> statement-breakpoint
ALTER TABLE "menu_images" ADD CONSTRAINT "menu_images_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;