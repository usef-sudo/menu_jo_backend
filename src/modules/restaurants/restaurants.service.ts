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
import { eq, and, sql, ilike, or, gte, lte, desc, inArray } from "drizzle-orm";

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

  async list(
    filter: {
      categoryId?: string;
      search?: string;
      minCostLevel?: number;
      maxCostLevel?: number;
      openOnly?: boolean;
      sort?: string;
      facilityIds?: string[];
    } = {},
    limit = 50,
    offset = 0,
  ) {
    // Simple text search on name
    if (filter.search) {
      return await db
        .select()
        .from(restaurants)
        .where(
          or(
            ilike(restaurants.name_en, `%${filter.search}%`),
            ilike(restaurants.name_ar, `%${filter.search}%`),
          ),
        )
        .limit(limit)
        .offset(offset);
    }

    // Base query with branches aggregated for cost / votes / open flag
    let query = db
      .select({
        id: restaurants.id,
        nameEn: restaurants.name_en,
        nameAr: restaurants.name_ar,
        descriptionEn: restaurants.description_en,
        descriptionAr: restaurants.description_ar,
        logoUrl: restaurants.logoUrl,
        phone: restaurants.phone,
        createdAt: restaurants.createdAt,
        // averages and aggregates from branches
        costLevel: sql<number>`avg(${branches.costLevel})`,
        votes: sql<number>`sum(coalesce(${branches.upVotes}, 0) - coalesce(${branches.downVotes}, 0))`,
        isOpen: sql<number>`max(coalesce(${branches.isOpen}, 0))`,
      })
      .from(restaurants)
      .leftJoin(branches, eq(branches.restaurantId, restaurants.id));

    const conditions = [];

    if (filter.categoryId) {
      query = query.innerJoin(
        restaurantCategories,
        eq(restaurantCategories.restaurantId, restaurants.id),
      );
      conditions.push(eq(restaurantCategories.categoryId, filter.categoryId));
    }

    if (filter.facilityIds && filter.facilityIds.length > 0) {
      query = query.innerJoin(
        branchFacilities,
        eq(branchFacilities.branchId, branches.id),
      );
      conditions.push(inArray(branchFacilities.facilityId, filter.facilityIds));
    }

    if (filter.minCostLevel != null) {
      conditions.push(gte(branches.costLevel, filter.minCostLevel));
    }

    if (filter.maxCostLevel != null) {
      conditions.push(lte(branches.costLevel, filter.maxCostLevel));
    }

    if (filter.openOnly) {
      conditions.push(eq(branches.isOpen, 1));
    }

    const whereClause =
      conditions.length === 0 ? undefined : and(...conditions);

    const sortKey = (filter.sort || "").toLowerCase();

    const rows = await query
      .where(whereClause)
      .groupBy(restaurants.id)
      .orderBy(
        sortKey === "votes"
          ? desc(sql`votes`)
          : desc(restaurants.createdAt),
      )
      .limit(limit)
      .offset(offset);

    return rows;
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