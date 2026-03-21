import { db } from "../../db/client";
import { offers } from "../../db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm"; // Added necessary imports

export const OffersService = {
  async create(payload: any) {
    const [r] = await db.insert(offers).values(payload).returning();
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
  
  async list(activeOnly = true) {
    const now = new Date();
    
    if (activeOnly) {
      // Filter for active offers: startDate <= now <= endDate
      return await db.select()
        .from(offers)
        .where(and(
          lte(offers.startDate, now.toISOString()), // startDate <= now
          gte(offers.endDate, now.toISOString())     // endDate >= now
        ))
        .orderBy(desc(offers.startDate)); // Use desc() function
    }
    
    // Return all offers
    return await db.select()
      .from(offers)
      .orderBy(desc(offers.startDate)); // Use desc() function
  }
};