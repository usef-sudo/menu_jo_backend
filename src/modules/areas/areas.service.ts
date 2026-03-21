import { db } from "../../db/client";
import { areas } from "../../db/schema";

import { asc, eq } from "drizzle-orm";

export const AreasService = {
  async create(payload: { nameEn: string; nameAr: string }) {
    const [r] = await db.insert(areas).values({
      name_en: payload.nameEn,
      name_ar: payload.nameAr
    }).returning();
    return r;
  },
  async list() { return await db.select().from(areas).orderBy(asc(areas.name_en)); },

  async findById(id: string) {
    return await db.select().from(areas).where(eq(areas.id, id)).then((r) => r[0] || null);
  },

  async update(id: string, payload: { nameEn?: string; nameAr?: string }) {
    const patch: Partial<typeof areas.$inferInsert> = {};
    if (payload.nameEn !== undefined) patch.name_en = payload.nameEn;
    if (payload.nameAr !== undefined) patch.name_ar = payload.nameAr;
    if (Object.keys(patch).length === 0) return this.findById(id);
    await db.update(areas).set(patch).where(eq(areas.id, id));
    return this.findById(id);
  },

  async delete(id: string) {
    const row = await this.findById(id);
    if (!row) return false;
    await db.delete(areas).where(eq(areas.id, id));
    return true;
  },
};

