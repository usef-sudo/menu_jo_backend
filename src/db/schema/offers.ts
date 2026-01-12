import { pgTable, uuid, varchar, text, timestamp, date } from "drizzle-orm/pg-core";
import { restaurants } from "./restaurants";

export const offers = pgTable("offers", {
  id: uuid("id").defaultRandom().primaryKey(),
  restaurantId: uuid("restaurant_id")
    .references(() => restaurants.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  startDate: date("start_date"),
  endDate: date("end_date"),

  createdAt: timestamp("created_at").defaultNow(),
});
