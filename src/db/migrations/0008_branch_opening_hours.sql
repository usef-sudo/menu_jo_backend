CREATE TABLE "branch_opening_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"slot_index" integer DEFAULT 0 NOT NULL,
	"open_time" varchar(5) NOT NULL,
	"close_time" varchar(5) NOT NULL,
	"closes_next_day" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "branch_opening_hours" ADD CONSTRAINT "branch_opening_hours_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "branch_opening_hours_branch_day_slot" ON "branch_opening_hours" USING btree ("branch_id","day_of_week","slot_index");--> statement-breakpoint
-- Backfill from legacy branches.open_time / close_time (same slot every weekday; closes_next_day when interval crosses midnight, except 00:00 close = end of day).
INSERT INTO "branch_opening_hours" ("branch_id", "day_of_week", "slot_index", "open_time", "close_time", "closes_next_day")
SELECT b.id, gs.d, 0,
  substring(trim(b.open_time) from 1 for 5),
  substring(trim(b.close_time) from 1 for 5),
  CASE
    WHEN trim(b.close_time) = '00:00' AND trim(b.open_time) <> '00:00' THEN 0
    WHEN (
      (cast(split_part(trim(b.open_time), ':', 1) AS int) * 60 + cast(split_part(trim(b.open_time), ':', 2) AS int))
      <
      (cast(split_part(trim(b.close_time), ':', 1) AS int) * 60 + cast(split_part(trim(b.close_time), ':', 2) AS int))
    ) THEN 0
    ELSE 1
  END
FROM "branches" b
CROSS JOIN generate_series(1, 7) AS gs(d)
WHERE b.open_time IS NOT NULL AND b.close_time IS NOT NULL
  AND trim(b.open_time) ~ '^[0-9]{1,2}:[0-9]{2}$'
  AND trim(b.close_time) ~ '^[0-9]{1,2}:[0-9]{2}$';