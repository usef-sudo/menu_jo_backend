import { pgTable, uuid, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";
import { restaurants } from "./restaurants";
import { areas } from "./areas";

export const branches = pgTable("branches", {
  id: uuid("id").defaultRandom().primaryKey(),
  restaurantId: uuid("restaurant_id")
    .references(() => restaurants.id, { onDelete: "cascade" }),
  areaId: uuid("area_id")
    .references(() => areas.id, { onDelete: "set null" }),
  name_ar: varchar("name_ar", { length: 255 }).notNull(),
  name_en: varchar("name_en", { length: 255 }).notNull(),

  address: varchar("address", { length: 500 }),
  latitude: text("latitude"),
  longitude: text("longitude"),

  // opening hours (simple strings, e.g. "11:00")
  openTime: varchar("open_time", { length: 16 }),
  closeTime: varchar("close_time", { length: 16 }),

  // for sorting & filtering
  costLevel: integer("cost_level"), // 1 cheap - 5 expensive
  isOpen: integer("is_open").default(1),

  upVotes: integer("up_votes").default(0),
  downVotes: integer("down_votes").default(0),

  createdAt: timestamp("created_at").defaultNow(),
});
