import { and, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { favorites, restaurants } from "../../db/schema";

export class FavoritesService {
  static async listByUser(userId: string) {
    const rows = await db
      .select({
        id: favorites.id,
        restaurantId: favorites.restaurantId,
        createdAt: favorites.createdAt,
        restaurantNameEn: restaurants.name_en,
        restaurantNameAr: restaurants.name_ar,
      })
      .from(favorites)
      .innerJoin(restaurants, eq(favorites.restaurantId, restaurants.id))
      .where(eq(favorites.userId, userId))
      .orderBy(favorites.createdAt);

    return rows;
  }

  static async add(userId: string, restaurantId: string) {
    await db
      .insert(favorites)
      .values({
        userId,
        restaurantId,
      })
      .onConflictDoNothing();
  }

  static async remove(userId: string, restaurantId: string) {
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.restaurantId, restaurantId)
        )
      );
  }
}

