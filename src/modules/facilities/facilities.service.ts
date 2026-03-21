import { db } from "../../db/client";
import { facilities } from "../../db/schema";
import { asc, eq } from "drizzle-orm";

export const FacilitiesService = {
  async create(payload: { nameEn: string; nameAr: string; icon?: string }) {
    const [r] = await db.insert(facilities).values({
      name_en: payload.nameEn,
      name_ar: payload.nameAr,
      icon: payload.icon ?? null
    }).returning();
    return r;
  },
  async list() { return await db.select().from(facilities).orderBy(asc(facilities.name_en)); },

  async findById(id: string) {
    return await db.select().from(facilities).where(eq(facilities.id, id)).then((r) => r[0] || null);
  },

  async update(id: string, payload: { nameEn?: string; nameAr?: string; icon?: string | null }) {
    const patch: Partial<typeof facilities.$inferInsert> = {};
    if (payload.nameEn !== undefined) patch.name_en = payload.nameEn;
    if (payload.nameAr !== undefined) patch.name_ar = payload.nameAr;
    if (payload.icon !== undefined) patch.icon = payload.icon;
    if (Object.keys(patch).length === 0) return this.findById(id);
    await db.update(facilities).set(patch).where(eq(facilities.id, id));
    return this.findById(id);
  },

  async delete(id: string) {
    const row = await this.findById(id);
    if (!row) return false;
    await db.delete(facilities).where(eq(facilities.id, id));
    return true;
  },
};
