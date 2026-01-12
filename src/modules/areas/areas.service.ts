import { db } from "../../db/client";
import { areas } from "../../db/schema";

import { asc } from "drizzle-orm";

export const AreasService = {
  async create(payload: { nameEn: string; nameAr: string }) {
    const [r] = await db.insert(areas).values({
      name_en: payload.nameEn,
      name_ar: payload.nameAr
    }).returning();
    return r;
  },
  async list() { return await db.select().from(areas).orderBy(asc(areas.name_en)); }
};

