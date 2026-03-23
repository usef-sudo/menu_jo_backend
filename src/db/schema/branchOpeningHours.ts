import { pgTable, uuid, varchar, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { branches } from "./branches";

/** 1 = Monday … 7 = Sunday (matches Dart DateTime.weekday). */
export const branchOpeningHours = pgTable(
  "branch_opening_hours",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    slotIndex: integer("slot_index").notNull().default(0),
    openTime: varchar("open_time", { length: 5 }).notNull(),
    closeTime: varchar("close_time", { length: 5 }).notNull(),
    /** When 1, interval spans midnight: open from openTime until closeTime on the next calendar day. */
    closesNextDay: integer("closes_next_day").notNull().default(0),
  },
  (t) => [uniqueIndex("branch_opening_hours_branch_day_slot").on(t.branchId, t.dayOfWeek, t.slotIndex)],
);
