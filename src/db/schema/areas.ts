import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const areas = pgTable("areas", {
  id: uuid("id").defaultRandom().primaryKey(),
  name_en: varchar("name_en", { length: 255 }).notNull(),
    name_ar: varchar("name_ar", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
