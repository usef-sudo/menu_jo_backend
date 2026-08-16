import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const restaurants = pgTable("restaurants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name_en: varchar("name_en", { length: 255 }).notNull(),
  name_ar: varchar("name_ar", { length: 255 }).notNull(),
  logoUrl: text("logo_url"),
  description_en: text("description_en"),
  description_ar: text("description_ar"),
  phone: varchar("phone", { length: 20 }),
  websiteUrl: text("website_url"),
  instagramUrl: text("instagram_url"),
  facebookUrl: text("facebook_url"),
  talabatUrl: text("talabat_url"),
  careemUrl: text("careem_url"),
  createdAt: timestamp("created_at").defaultNow(),
});
