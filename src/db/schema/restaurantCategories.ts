import { pgTable, uuid, unique } from "drizzle-orm/pg-core";
import { restaurants } from "./restaurants";
import { categories } from "./categories";

export const restaurantCategories = pgTable(
  "restaurant_categories",
  {
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueCategory: unique("unique_restaurant_category").on(
      table.restaurantId,
      table.categoryId
    ),
  })
);
