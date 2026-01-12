import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const facilities = pgTable("facilities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name_en: varchar("name_en", { length: 255 }).notNull(),
  name_ar: varchar("name_ar", { length: 255 }).notNull(),

  icon: varchar("icon", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});
