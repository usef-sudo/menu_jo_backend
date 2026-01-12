import { db } from "../../db/client";
import { facilities } from "../../db/schema";
import { asc } from "drizzle-orm"; // Added asc and desc imports

export const FacilitiesService = {
  async create(payload: { nameEn: string; nameAr: string; icon?: string }) {
    const [r] = await db.insert(facilities).values({
      name_en: payload.nameEn,
      name_ar: payload.nameAr,
      icon: payload.icon ?? null
    }).returning();
    return r;
  },
  async list() { return await db.select().from(facilities).orderBy(asc(facilities.name_en)); }
};
