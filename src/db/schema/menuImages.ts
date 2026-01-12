// src/db/schema/menuImages.ts
import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import { branches } from "./branches";

export const menuImages = pgTable("menu_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  branchId: uuid("branch_id")
    .references(() => branches.id, { onDelete: "cascade" })
    .notNull(),
  imageUrl: text("image_url").notNull(),
  displayOrder: integer("display_order").default(0),
  isActive: integer("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});