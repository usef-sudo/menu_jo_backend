import { db } from "../../db/client";
import { restaurantCategories } from "../../db/schema";
import { eq, and } from "drizzle-orm"; // Add these imports

export const RestaurantCategoriesService = {
  async assign(restaurantId: string, categoryIds: string[]) {
    const pairs = categoryIds.map((c) => ({ 
      restaurantId: restaurantId, // Use camelCase if that's your schema field name
      categoryId: c 
    }));
    
    // FIXED: Remove the spread operator (...) before pairs
    await db.insert(restaurantCategories)
      .values(pairs) // Just pass the array directly
      .onConflictDoNothing();
    
    return true;
  },

  async unassign(restaurantId: string, categoryId: string) {
    // FIXED: Use eq() and and() functions instead of .eq() method
    await db.delete(restaurantCategories)
      .where(and(
        eq(restaurantCategories.restaurantId, restaurantId),
        eq(restaurantCategories.categoryId, categoryId)
      ));
    
    return true;
  }
};