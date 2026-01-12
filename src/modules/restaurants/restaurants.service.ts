import { db } from "../../db/client";
import { restaurants, restaurantCategories } from "../../db/schema";
import { eq, and, sql, ilike, or } from "drizzle-orm"; // Added sql and ilike imports

export interface CreateRestaurantDTO {
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  logoUrl?: string | null;
  phone?: string | null;
  categoryIds?: string[]; // many-to-many
}

export const RestaurantsService = {
  async create(dto: CreateRestaurantDTO) {
    const [row] = await db.insert(restaurants).values({
      name_en: dto.nameEn,
      name_ar: dto.nameAr,
      description_en: dto.descriptionEn ?? null,
      description_ar: dto.descriptionAr ?? null,
      logoUrl: dto.logoUrl ?? null,
      phone: dto.phone ?? null
    }).returning();

    if (dto.categoryIds && dto.categoryIds.length) {
      const pairs = dto.categoryIds.map((catId) => ({
        restaurantId: row.id,
        categoryId: catId
      }));

      await db.insert(restaurantCategories).values(pairs);
    }
    return row;
  },

  async findById(id: string) {
    return await db.select()
      .from(restaurants)
      .where(eq(restaurants.id, id))
      .then((r) => r[0] || null);
  },

  async list(filter: { categoryId?: string; search?: string } = {}, limit = 50, offset = 0) {
    // Handle search filter
    if (filter.search) {
      return await db.select()
        .from(restaurants)
        .where(or(
          ilike(restaurants.name_en, `%${filter.search}%`),
          ilike(restaurants.name_ar, `%${filter.search}%`)
        ))
        .limit(limit)
        .offset(offset);
    }

    // Handle category filter with join
    if (filter.categoryId) {
      return await db.select({
        id: restaurants.id,
        nameEn: restaurants.name_en,
        nameAr: restaurants.name_ar,
        descriptionEn: restaurants.description_en,
        descriptionAr: restaurants.description_ar,
        logoUrl: restaurants.logoUrl,
        phone: restaurants.phone,
        createdAt: restaurants.createdAt
      })
        .from(restaurants)
        .innerJoin(
          restaurantCategories,
          eq(restaurantCategories.restaurantId, restaurants.id)
        )
        .where(eq(restaurantCategories.categoryId, filter.categoryId))
        .limit(limit)
        .offset(offset);
    }

    // Default: return all restaurants
    return await db.select()
      .from(restaurants)
      .limit(limit)
      .offset(offset);
  },
};