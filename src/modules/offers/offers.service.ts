import { db } from "../../db/client";
import { offers } from "../../db/schema";
import { eq, desc, and, lte, gte, SQL } from "drizzle-orm";

function toYyyyMmDd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface CreateOfferInput {
  restaurantId: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export const OffersService = {
  async create(input: CreateOfferInput) {
    const today = new Date();
    const defaultEnd = new Date(today);
    defaultEnd.setDate(defaultEnd.getDate() + 30);

    let startDate = (input.startDate ?? "").trim() || toYyyyMmDd(today);
    let endDate = (input.endDate ?? "").trim() || toYyyyMmDd(defaultEnd);

    if (endDate < startDate) {
      const tmp = startDate;
      startDate = endDate;
      endDate = tmp;
    }

    const [r] = await db
      .insert(offers)
      .values({
        restaurantId: input.restaurantId,
        title: input.title,
        description: input.description?.trim() || null,
        imageUrl: input.imageUrl?.trim() || null,
        startDate,
        endDate,
      })
      .returning();
    return r;
  },

  async findById(id: string) {
    return await db.select().from(offers).where(eq(offers.id, id)).then((r) => r[0] || null);
  },

  async update(
    id: string,
    dto: Partial<{
      restaurantId: string;
      title: string;
      description: string | null;
      imageUrl: string | null;
      startDate: string | null;
      endDate: string | null;
    }>,
  ) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const patch: Partial<typeof offers.$inferInsert> = {};
    if (dto.restaurantId !== undefined) patch.restaurantId = dto.restaurantId;
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.imageUrl !== undefined) patch.imageUrl = dto.imageUrl;
    if (dto.startDate !== undefined) patch.startDate = dto.startDate;
    if (dto.endDate !== undefined) patch.endDate = dto.endDate;
    if (Object.keys(patch).length === 0) return existing;
    const [row] = await db.update(offers).set(patch).where(eq(offers.id, id)).returning();
    return row;
  },

  async delete(id: string) {
    const r = await this.findById(id);
    if (!r) return false;
    await db.delete(offers).where(eq(offers.id, id));
    return true;
  },

  /**
   * @param activeOnly When true, only offers whose date range includes today (UTC date).
   * @param filterRestaurantId When set, restrict to this restaurant.
   */
  async list(activeOnly = true, filterRestaurantId?: string) {
    const day = toYyyyMmDd(new Date());
    const parts: SQL[] = [];

    if (filterRestaurantId) {
      parts.push(eq(offers.restaurantId, filterRestaurantId));
    }
    if (activeOnly) {
      parts.push(lte(offers.startDate, day));
      parts.push(gte(offers.endDate, day));
    }

    const base = db.select().from(offers);
    if (parts.length === 0) {
      return await base.orderBy(desc(offers.startDate));
    }
    return await base.where(and(...parts)).orderBy(desc(offers.startDate));
  },
};
