import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./users";
import { restaurants } from "./restaurants";

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    uniqueUserRestaurant: unique("unique_user_restaurant").on(
      table.userId,
      table.restaurantId
    ),
  })
);

