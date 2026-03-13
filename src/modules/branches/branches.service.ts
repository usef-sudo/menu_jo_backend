import { db } from "../../db/client";
import { branches, branchFacilities, menuImages, facilities } from "../../db/schema";
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
  openTime?: string;
  closeTime?: string;
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
      isOpen: dto.isOpen ?? 1,
      openTime: dto.openTime ?? null,
      closeTime: dto.closeTime ?? null,
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
    const query = db.select({
      id: branches.id,
      restaurantId: branches.restaurantId,
      areaId: branches.areaId,
      nameEn: branches.name_en,
      nameAr: branches.name_ar,
      address: branches.address,
      latitude: branches.latitude,
      longitude: branches.longitude,
      costLevel: branches.costLevel,
      isOpen: branches.isOpen,
      upVotes: branches.upVotes,
      downVotes: branches.downVotes,
      openTime: branches.openTime,
      closeTime: branches.closeTime,
      facilities: sql<string[]>`COALESCE(array_agg(DISTINCT ${facilities.name_en}) FILTER (WHERE ${facilities.name_en} IS NOT NULL), ARRAY[]::text[])`,
    })
      .from(branches)
      .leftJoin(branchFacilities, eq(branchFacilities.branchId, branches.id))
      .leftJoin(facilities, eq(branchFacilities.facilityId, facilities.id))
      .groupBy(
        branches.id,
        branches.restaurantId,
        branches.areaId,
        branches.name_en,
        branches.name_ar,
        branches.address,
        branches.latitude,
        branches.longitude,
        branches.costLevel,
        branches.isOpen,
        branches.upVotes,
        branches.downVotes,
        branches.openTime,
        branches.closeTime,
      );

    if (whereCondition) {
      query.where(whereCondition);
    }

    return await query
      .limit(limit)
      .offset(offset);
  },

  async listNearby(lat: number, lng: number, limit = 50, offset = 0) {
    const rows = await this.list({}, limit, offset);

    const toRadians = (deg: number) => (deg * Math.PI) / 180;

    const withDistance = rows
      .map((b: any) => {
        if (!b.latitude || !b.longitude) {
          return { ...b, distanceKm: null };
        }
        const lat1 = Number.parseFloat(b.latitude);
        const lon1 = Number.parseFloat(b.longitude);
        const lat2 = lat;
        const lon2 = lng;

        const R = 6371; // km
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;

        return { ...b, distanceKm: Number(d.toFixed(2)) };
      })
      .filter((b) => b.distanceKm !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return withDistance;
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
