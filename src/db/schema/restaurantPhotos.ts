import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import { restaurants } from "./restaurants";

export const restaurantPhotos = pgTable("restaurant_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  restaurantId: uuid("restaurant_id")
    .references(() => restaurants.id, { onDelete: "cascade" })
    .notNull(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  displayOrder: integer("display_order").default(0),
  isActive: integer("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

