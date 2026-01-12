
// src/db/schema/categories.ts
import { pgTable, uuid, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // English fields
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  descriptionEn: text("description_en"),
  
  // Arabic fields
  nameAr: varchar("name_ar", { length: 255 }).notNull(),
  descriptionAr: text("description_ar"),
  
  // Common fields
  icon: text("icon"),
  imageUrl: text("image_url"), // New: For category image
  isActive: integer("is_active").default(1),
  displayOrder: integer("display_order").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});