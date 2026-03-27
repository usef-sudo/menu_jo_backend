import { db } from "../../db/client";
import {
  branches,
  branchFacilities,
  branchOpeningHours,
  menuImages,
  facilities,
  offers,
} from "../../db/schema";
import { eq, sql, and, asc, exists, inArray, type SQL } from "drizzle-orm";
import {
  computeOpenNow,
  normalizeOpeningHourInputs,
  validateOpeningSlot,
  type OpeningHourInput,
} from "./branchOpeningHours.util";

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
  /** Weekly schedule; when set, rows are stored and Monday slot 0 is copied to legacy open_time/close_time. */
  openingHours?: OpeningHourInput[];
}

export interface UpdateBranchDTO {
  restaurantId?: string;
  areaId?: string | null;
  nameEn?: string;
  nameAr?: string;
  address?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  costLevel?: number;
  isOpen?: number;
  openTime?: string | null;
  closeTime?: string | null;
}

export interface BranchListFilter {
  restaurantId?: string;
  areaId?: string;
  /** 1 = Monday … 7 = Sunday; use with openAtTimeMinutes to filter branches open at that local wall time. */
  openAtWeekday?: number;
  openAtTimeMinutes?: number;
}

function serializeOpeningHour(h: typeof branchOpeningHours.$inferSelect) {
  return {
    id: h.id,
    dayOfWeek: h.dayOfWeek,
    slotIndex: h.slotIndex,
    openTime: h.openTime,
    closeTime: h.closeTime,
    closesNextDay: h.closesNextDay === 1,
  };
}

async function loadOpeningHoursMap(branchIds: string[]) {
  const map = new Map<string, ReturnType<typeof serializeOpeningHour>[]>();
  if (branchIds.length === 0) return map;
  const rows = await db
    .select()
    .from(branchOpeningHours)
    .where(inArray(branchOpeningHours.branchId, branchIds))
    .orderBy(asc(branchOpeningHours.dayOfWeek), asc(branchOpeningHours.slotIndex));
  for (const r of rows) {
    const list = map.get(r.branchId) ?? [];
    list.push(serializeOpeningHour(r));
    map.set(r.branchId, list);
  }
  return map;
}

async function loadActiveOfferCountByRestaurantId(restaurantIds: string[]) {
  const map = new Map<string, number>();
  if (restaurantIds.length === 0) return map;
  const day = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select({
      restaurantId: offers.restaurantId,
      count: sql<number>`COUNT(*)`,
    })
    .from(offers)
    .where(
      and(
        inArray(offers.restaurantId, restaurantIds),
        sql`${offers.startDate} <= ${day}`,
        sql`${offers.endDate} >= ${day}`,
      ),
    )
    .groupBy(offers.restaurantId);

  for (const r of rows) {
    if (!r.restaurantId) continue;
    map.set(r.restaurantId, Number(r.count ?? 0));
  }
  return map;
}

/** 1 = Monday … 7 = Sunday; includes overnight spill from previous calendar day. */
function openingTimeExistsFilter(weekday: number, timeMinutes: number): SQL {
  const prevWeekday = weekday === 1 ? 7 : weekday - 1;

  const openMins = sql`(cast(split_part(${branchOpeningHours.openTime}, ':', 1) as int) * 60 + cast(split_part(${branchOpeningHours.openTime}, ':', 2) as int))`;
  const closeMinsRaw = sql`(cast(split_part(${branchOpeningHours.closeTime}, ':', 1) as int) * 60 + cast(split_part(${branchOpeningHours.closeTime}, ':', 2) as int))`;
  const closeMinsEff = sql`CASE WHEN ${branchOpeningHours.closeTime} = '00:00' AND ${branchOpeningHours.closesNextDay} = 0 THEN 1440 ELSE ${closeMinsRaw} END`;

  const sameCalendarDay = sql`(
    ${branchOpeningHours.dayOfWeek} = ${weekday}
    AND (
      (${branchOpeningHours.closesNextDay} = 0 AND ${openMins} <= ${timeMinutes} AND ${timeMinutes} < ${closeMinsEff})
      OR
      (${branchOpeningHours.closesNextDay} = 1 AND ${openMins} <= ${timeMinutes})
    )
  )`;

  const overnightFromPreviousDay = sql`(
    ${branchOpeningHours.dayOfWeek} = ${prevWeekday}
    AND ${branchOpeningHours.closesNextDay} = 1
    AND ${timeMinutes} < ${closeMinsRaw}
  )`;

  const rowMatches = sql`(${sameCalendarDay} OR ${overnightFromPreviousDay})`;

  return exists(
    db
      .select({ one: sql`1` })
      .from(branchOpeningHours)
      .where(and(eq(branchOpeningHours.branchId, branches.id), rowMatches)),
  );
}

async function syncLegacyOpenCloseFromMonday(
  branchId: string,
  opts?: { clearIfNoHours?: boolean },
) {
  const rows = await db
    .select()
    .from(branchOpeningHours)
    .where(eq(branchOpeningHours.branchId, branchId));
  if (rows.length === 0) {
    if (opts?.clearIfNoHours) {
      await db
        .update(branches)
        .set({ openTime: null, closeTime: null })
        .where(eq(branches.id, branchId));
    }
    return;
  }
  const mon =
    rows.find((r) => r.dayOfWeek === 1 && r.slotIndex === 0) ?? null;
  if (mon) {
    await db
      .update(branches)
      .set({ openTime: mon.openTime, closeTime: mon.closeTime })
      .where(eq(branches.id, branchId));
  }
}

export const BranchesService = {
  async create(dto: CreateBranchDTO) {
    const normalizedHours =
      dto.openingHours && dto.openingHours.length > 0
        ? normalizeOpeningHourInputs(dto.openingHours)
        : [];
    if (normalizedHours.length > 0) {
      const seen = new Set<string>();
      for (const s of normalizedHours) {
        const key = `${s.dayOfWeek}-${s.slotIndex ?? 0}`;
        if (seen.has(key)) throw new Error("DUPLICATE_OPENING_SLOT");
        seen.add(key);
        validateOpeningSlot({
          dayOfWeek: s.dayOfWeek,
          slotIndex: s.slotIndex ?? 0,
          openTime: s.openTime,
          closeTime: s.closeTime,
          closesNextDay: s.closesNextDay ?? false,
        });
      }
    }

    const [b] = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(branches)
        .values({
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
        })
        .returning();

      if (dto.facilityIds && dto.facilityIds.length) {
        const pairs = dto.facilityIds.map((f) => ({
          branchId: inserted.id,
          facilityId: f,
        }));
        await tx.insert(branchFacilities).values(pairs);
      }

      if (normalizedHours.length > 0) {
        await tx.insert(branchOpeningHours).values(
          normalizedHours.map((s) => ({
            branchId: inserted.id,
            dayOfWeek: s.dayOfWeek,
            slotIndex: s.slotIndex ?? 0,
            openTime: s.openTime,
            closeTime: s.closeTime,
            closesNextDay: s.closesNextDay ? 1 : 0,
          })),
        );
      }

      return [inserted];
    });

    await syncLegacyOpenCloseFromMonday(b.id, { clearIfNoHours: false });
    return await this.findByIdWithOpeningHours(b.id);
  },

  async update(id: string, dto: UpdateBranchDTO) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const patch: Partial<typeof branches.$inferInsert> = {};
    if (dto.restaurantId !== undefined) patch.restaurantId = dto.restaurantId;
    if (dto.areaId !== undefined) patch.areaId = dto.areaId;
    if (dto.nameEn !== undefined) patch.name_en = dto.nameEn;
    if (dto.nameAr !== undefined) patch.name_ar = dto.nameAr;
    if (dto.address !== undefined) patch.address = dto.address ?? null;
    if (dto.latitude !== undefined) patch.latitude = dto.latitude ?? null;
    if (dto.longitude !== undefined) patch.longitude = dto.longitude ?? null;
    if (dto.costLevel !== undefined) patch.costLevel = dto.costLevel;
    if (dto.isOpen !== undefined) patch.isOpen = dto.isOpen;
    if (dto.openTime !== undefined) patch.openTime = dto.openTime ?? null;
    if (dto.closeTime !== undefined) patch.closeTime = dto.closeTime ?? null;

    if (Object.keys(patch).length > 0) {
      await db.update(branches).set(patch).where(eq(branches.id, id));
    }

    return await this.findByIdWithOpeningHours(id);
  },

  async replaceOpeningHours(branchId: string, slots: OpeningHourInput[]) {
    const branch = await this.findById(branchId);
    if (!branch) return null;

    const normalized = normalizeOpeningHourInputs(slots);
    const seen = new Set<string>();
    for (const s of normalized) {
      const key = `${s.dayOfWeek}-${s.slotIndex}`;
      if (seen.has(key)) throw new Error("DUPLICATE_OPENING_SLOT");
      seen.add(key);
      validateOpeningSlot({
        dayOfWeek: s.dayOfWeek,
        slotIndex: s.slotIndex ?? 0,
        openTime: s.openTime,
        closeTime: s.closeTime,
        closesNextDay: s.closesNextDay ?? false,
      });
    }

    await db.transaction(async (tx) => {
      await tx.delete(branchOpeningHours).where(eq(branchOpeningHours.branchId, branchId));
      if (normalized.length > 0) {
        await tx.insert(branchOpeningHours).values(
          normalized.map((s) => ({
            branchId,
            dayOfWeek: s.dayOfWeek,
            slotIndex: s.slotIndex ?? 0,
            openTime: s.openTime,
            closeTime: s.closeTime,
            closesNextDay: s.closesNextDay ? 1 : 0,
          })),
        );
      }
    });

    await syncLegacyOpenCloseFromMonday(branchId, { clearIfNoHours: true });
    return await this.findByIdWithOpeningHours(branchId);
  },

  async delete(id: string) {
    const existing = await this.findById(id);
    if (!existing) return false;
    await db.delete(branches).where(eq(branches.id, id));
    return true;
  },

  async findById(id: string) {
    return await db
      .select()
      .from(branches)
      .where(eq(branches.id, id))
      .then((r) => r[0] || null);
  },

  async findByIdWithOpeningHours(id: string) {
    const b = await this.findById(id);
    if (!b) return null;
    const hoursMap = await loadOpeningHoursMap([id]);
    const openingHours = hoursMap.get(id) ?? [];
    const offersMap = await loadActiveOfferCountByRestaurantId(
      b.restaurantId ? [b.restaurantId] : [],
    );
    const activeOfferCount = b.restaurantId
      ? (offersMap.get(b.restaurantId) ?? 0)
      : 0;
    return {
      ...b,
      openingHours,
      activeOfferCount,
      openNow: computeOpenNow({
        isOpen: b.isOpen,
        openingHours: openingHours.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          closesNextDay: h.closesNextDay,
        })),
        openTime: b.openTime,
        closeTime: b.closeTime,
      }),
    };
  },

  async list(filter: BranchListFilter = {}, limit = 50, offset = 0) {
    const conditions: SQL[] = [];

    if (filter.restaurantId && filter.areaId) {
      conditions.push(
        eq(branches.restaurantId, filter.restaurantId),
        eq(branches.areaId, filter.areaId),
      );
    } else if (filter.restaurantId) {
      conditions.push(eq(branches.restaurantId, filter.restaurantId));
    } else if (filter.areaId) {
      conditions.push(eq(branches.areaId, filter.areaId));
    }

    if (
      filter.openAtWeekday !== undefined &&
      filter.openAtTimeMinutes !== undefined
    ) {
      conditions.push(openingTimeExistsFilter(filter.openAtWeekday, filter.openAtTimeMinutes));
    }

    const query = db
      .select({
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

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const rows = await query.limit(limit).offset(offset);
    const hoursMap = await loadOpeningHoursMap(rows.map((r) => r.id));
    const offersMap = await loadActiveOfferCountByRestaurantId(
      rows
        .map((r) => r.restaurantId)
        .filter((id): id is string => Boolean(id)),
    );
    return rows.map((r) => ({
      ...r,
      openingHours: hoursMap.get(r.id) ?? [],
      activeOfferCount: r.restaurantId ? (offersMap.get(r.restaurantId) ?? 0) : 0,
      openNow: computeOpenNow({
        isOpen: r.isOpen,
        openingHours: (hoursMap.get(r.id) ?? []).map((h) => ({
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          closesNextDay: h.closesNextDay,
        })),
        openTime: r.openTime,
        closeTime: r.closeTime,
      }),
    }));
  },

  async listNearby(lat: number, lng: number, limit = 50, offset = 0) {
    const rows = await this.list({}, limit, offset);

    const toRadians = (deg: number) => (deg * Math.PI) / 180;

    const withDistance = rows
      .map((b) => {
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
      .sort((a, b) => a.distanceKm! - b.distanceKm!);

    return withDistance;
  },

  async incrementVoteCounters(branchId: string, up: number, down: number) {
    await db
      .update(branches)
      .set({
        upVotes: sql`GREATEST(0, COALESCE(up_votes, 0) + ${up})`,
        downVotes: sql`GREATEST(0, COALESCE(down_votes, 0) + ${down})`,
      })
      .where(eq(branches.id, branchId));
  },

  async findByIdWithMenuImages(id: string) {
    const branch = await this.findByIdWithOpeningHours(id);
    if (!branch) return null;

    const images = await db
      .select()
      .from(menuImages)
      .where(eq(menuImages.branchId, id))
      .orderBy(asc(menuImages.displayOrder));

    return { ...branch, menuImages: images };
  },

  async listWithMenuImages(
    filter: { restaurantId?: string; areaId?: string } = {},
    limit = 50,
    offset = 0,
  ) {
    const branchRows = await this.list(filter, limit, offset);
    const branchIds = branchRows.map((b) => b.id);

    if (branchIds.length === 0) {
      return branchRows.map((b) => ({ ...b, menuImages: [] }));
    }

    const allImages = await db
      .select()
      .from(menuImages)
      .where(sql`${menuImages.branchId} IN (${sql.join(branchIds, sql`, `)})`)
      .orderBy(asc(menuImages.displayOrder));

    const imagesByBranch = new Map<string, typeof allImages>();
    allImages.forEach((img) => {
      if (!imagesByBranch.has(img.branchId)) {
        imagesByBranch.set(img.branchId, []);
      }
      imagesByBranch.get(img.branchId)!.push(img);
    });

    return branchRows.map((branch) => ({
      ...branch,
      menuImages: imagesByBranch.get(branch.id) || [],
    }));
  },
};

export { parseHmToMinutes } from "./branchOpeningHours.util";
