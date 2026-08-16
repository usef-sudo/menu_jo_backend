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
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  talabatUrl?: string | null;
  careemUrl?: string | null;
  categoryIds?: string[]; // many-to-many
}

export interface UpdateRestaurantDTO {
  nameEn?: string;
  nameAr?: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  logoUrl?: string | null;
  phone?: string | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  talabatUrl?: string | null;
  careemUrl?: string | null;
  /** When set, replaces all restaurant–category links. */
  categoryIds?: string[];
}

export const RestaurantsService = {
  async create(dto: CreateRestaurantDTO) {
    const [row] = await db.insert(restaurants).values({
      name_en: dto.nameEn,
      name_ar: dto.nameAr,
      description_en: dto.descriptionEn ?? null,
      description_ar: dto.descriptionAr ?? null,
      logoUrl: dto.logoUrl ?? null,
      phone: dto.phone ?? null,
      websiteUrl: dto.websiteUrl ?? null,
      instagramUrl: dto.instagramUrl ?? null,
      facebookUrl: dto.facebookUrl ?? null,
      talabatUrl: dto.talabatUrl ?? null,
      careemUrl: dto.careemUrl ?? null,
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

  async createBulk(items: CreateRestaurantDTO[]) {
    const results: Array<{
      index: number;
      ok: boolean;
      item?: Awaited<ReturnType<typeof RestaurantsService.create>>;
      message?: string;
    }> = [];
    for (let i = 0; i < items.length; i++) {
      try {
        const item = await this.create(items[i]);
        results.push({ index: i, ok: true, item });
      } catch (err) {
        results.push({
          index: i,
          ok: false,
          message:
            err instanceof Error ? err.message : "Failed to create restaurant",
        });
      }
    }
    return {
      created: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    };
  },

  async update(id: string, dto: UpdateRestaurantDTO) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const patch: Partial<typeof restaurants.$inferInsert> = {};
    if (dto.nameEn !== undefined) patch.name_en = dto.nameEn;
    if (dto.nameAr !== undefined) patch.name_ar = dto.nameAr;
    if (dto.descriptionEn !== undefined) patch.description_en = dto.descriptionEn;
    if (dto.descriptionAr !== undefined) patch.description_ar = dto.descriptionAr;
    if (dto.logoUrl !== undefined) patch.logoUrl = dto.logoUrl;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.websiteUrl !== undefined) patch.websiteUrl = dto.websiteUrl;
    if (dto.instagramUrl !== undefined) patch.instagramUrl = dto.instagramUrl;
    if (dto.facebookUrl !== undefined) patch.facebookUrl = dto.facebookUrl;
    if (dto.talabatUrl !== undefined) patch.talabatUrl = dto.talabatUrl;
    if (dto.careemUrl !== undefined) patch.careemUrl = dto.careemUrl;

    if (Object.keys(patch).length > 0) {
      await db.update(restaurants).set(patch).where(eq(restaurants.id, id));
    }

    if (dto.categoryIds !== undefined) {
      await db
        .delete(restaurantCategories)
        .where(eq(restaurantCategories.restaurantId, id));
      if (dto.categoryIds.length > 0) {
        await db.insert(restaurantCategories).values(
          dto.categoryIds.map((categoryId) => ({
            restaurantId: id,
            categoryId,
          })),
        );
      }
    }

    return await this.findById(id);
  },

  async delete(id: string) {
    const existing = await this.findById(id);
    if (!existing) return false;
    await db.delete(restaurants).where(eq(restaurants.id, id));
    return true;
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

    const categoryRows = await db
      .select({
        id: categories.id,
        nameEn: categories.nameEn,
        nameAr: categories.nameAr,
      })
      .from(restaurantCategories)
      .innerJoin(
        categories,
        eq(restaurantCategories.categoryId, categories.id),
      )
      .where(eq(restaurantCategories.restaurantId, id));

    const categoryRow = categoryRows[0] ?? null;

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
      websiteUrl: restaurant.websiteUrl,
      instagramUrl: restaurant.instagramUrl,
      facebookUrl: restaurant.facebookUrl,
      talabatUrl: restaurant.talabatUrl,
      careemUrl: restaurant.careemUrl,
      createdAt: restaurant.createdAt,
      category: categoryRow ?? null,
      categories: categoryRows,
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