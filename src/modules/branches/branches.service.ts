import { db } from "../../db/client";
import { branches, branchFacilities, menuImages } from "../../db/schema";
import { eq, sql, or, ilike } from "drizzle-orm";
import { and } from "drizzle-orm";
import { asc } from "drizzle-orm"; // Added asc and desc imports

export interface CreateBranchDTO {
  restaurantId: string;
  areaId?: string | null;
  nameEn: string;
  nameAr: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  facilityIds?: string[];
  costLevel?: number;
  isOpen?: number;
}

export const BranchesService = {
  async create(dto: CreateBranchDTO) {
    const [b] = await db.insert(branches).values({
      restaurantId: dto.restaurantId,
      areaId: dto.areaId ?? null,
      name_en: dto.nameEn,
      name_ar: dto.nameAr,
      address: dto.address ?? null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      costLevel: dto.costLevel ?? 1,
      isOpen: dto.isOpen ?? 1
    }).returning();

    if (dto.facilityIds && dto.facilityIds.length) {
      const pairs = dto.facilityIds.map((f) => ({ branchId: b.id, facilityId: f }));
      await db.insert(branchFacilities).values(pairs);
    }
    return b;
  },

  async findById(id: string) {
    return await db.select()
      .from(branches)
      .where(eq(branches.id, id))
      .then((r) => r[0] || null);
  },


  async list(filter: { restaurantId?: string; areaId?: string } = {}, limit = 50, offset = 0) {
    // Build where condition
    let whereCondition;
    if (filter.restaurantId && filter.areaId) {
      whereCondition = and(
        eq(branches.restaurantId, filter.restaurantId),
        eq(branches.areaId, filter.areaId)
      );
    } else if (filter.restaurantId) {
      whereCondition = eq(branches.restaurantId, filter.restaurantId);
    } else if (filter.areaId) {
      whereCondition = eq(branches.areaId, filter.areaId);
    }

    // Build the query
    const query = db.select()
      .from(branches);

    if (whereCondition) {
      query.where(whereCondition);
    }

    return await query
      .limit(limit)
      .offset(offset);
  },

  async incrementVoteCounters(branchId: string, up: number, down: number) {
    // Use sql template literal for raw SQL expressions
    await db.update(branches)
      .set({
        upVotes: sql`GREATEST(0, COALESCE(up_votes, 0) + ${up})`,
        downVotes: sql`GREATEST(0, COALESCE(down_votes, 0) + ${down})`
      })
      .where(eq(branches.id, branchId));
  },
  async findByIdWithMenuImages(id: string) {
    const branch = await this.findById(id);
    if (!branch) return null;

    const images = await db.select()
      .from(menuImages)
      .where(eq(menuImages.branchId, id))
      .orderBy(asc(menuImages.displayOrder));

    return { ...branch, menuImages: images };
  },

  async listWithMenuImages(filter: { restaurantId?: string; areaId?: string } = {}, limit = 50, offset = 0) {
    const branches = await this.list(filter, limit, offset);

    // Get all menu images for these branches
    const branchIds = branches.map(b => b.id);

    if (branchIds.length === 0) {
      return branches.map(b => ({ ...b, menuImages: [] }));
    }

    const allImages = await db.select()
      .from(menuImages)
      .where(sql`${menuImages.branchId} IN (${sql.join(branchIds, sql`, `)})`)
      .orderBy(asc(menuImages.displayOrder));

    // Group images by branchId
    const imagesByBranch = new Map<string, typeof allImages>();
    allImages.forEach(img => {
      if (!imagesByBranch.has(img.branchId)) {
        imagesByBranch.set(img.branchId, []);
      }
      imagesByBranch.get(img.branchId)!.push(img);
    });

    // Attach images to branches
    return branches.map(branch => ({
      ...branch,
      menuImages: imagesByBranch.get(branch.id) || []
    }));
  }
};
