import { db } from "../../db/client";
import {
  restaurants,
  restaurantCategories,
  categories,
  branches,
  branchFacilities,
  facilities,
  reviews,
} from "../../db/schema";
import { eq, and, sql, ilike, or } from "drizzle-orm";

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

  async getDetails(id: string) {
    const restaurant = await this.findById(id);
    if (!restaurant) {
      return null;
    }

    const [categoryRow] = await db
      .select({
        id: categories.id,
        nameEn: categories.nameEn,
      })
      .from(restaurantCategories)
      .innerJoin(
        categories,
        eq(restaurantCategories.categoryId, categories.id),
      )
      .where(eq(restaurantCategories.restaurantId, id))
      .limit(1);

    const branchRows = await db
      .select()
      .from(branches)
      .where(eq(branches.restaurantId, id));

    const totalVotes = branchRows.reduce(
      (sum, b) => sum + (b.upVotes ?? 0) + (b.downVotes ?? 0),
      0,
    );

    const facilityRows = await db
      .selectDistinct({
        id: facilities.id,
        nameEn: facilities.name_en,
        icon: facilities.icon,
      })
      .from(branchFacilities)
      .innerJoin(branches, eq(branchFacilities.branchId, branches.id))
      .innerJoin(facilities, eq(branchFacilities.facilityId, facilities.id))
      .where(eq(branches.restaurantId, id));

    return {
      id: restaurant.id,
      nameEn: restaurant.name_en,
      nameAr: restaurant.name_ar,
      descriptionEn: restaurant.description_en,
      descriptionAr: restaurant.description_ar,
      logoUrl: restaurant.logoUrl,
      phone: restaurant.phone,
      createdAt: restaurant.createdAt,
      category: categoryRow ?? null,
      branches: branchRows,
      facilities: facilityRows,
      branchesCount: branchRows.length,
      totalVotes,
      // rating aggregates across all reviews on branches of this restaurant
      ...(await (async () => {
        const ratingRows = await db
          .select({
            rating: sql<number>`reviews.rating`,
          })
          .from(reviews)
          .innerJoin(branches, eq(reviews.branchId, branches.id))
          .where(eq(branches.restaurantId, id));

        if (!ratingRows.length) {
          return { avgRating: 0, reviewsCount: 0 };
        }

        const sum = ratingRows.reduce(
          (acc, row) => acc + (row.rating ?? 0),
          0,
        );
        const count = ratingRows.length;
        return { avgRating: sum / count, reviewsCount: count };
      })()),
    };
  },
};