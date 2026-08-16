import { Request, Response, NextFunction } from "express";
import { BranchesService, parseHmToMinutes, type CreateBranchDTO } from "./branches.service";
import { isUuid, trimToNull } from "../shared/httpValidation";
import type { OpeningHourInput } from "./branchOpeningHours.util";

const MAX_NAME = 255;
const MAX_ADDRESS = 500;
const MAX_TIME = 16;

const OPENING_HOUR_ERROR_MESSAGES: Record<string, string> = {
  INVALID_DAY_OF_WEEK: "dayOfWeek must be 1–7 (Monday–Sunday)",
  INVALID_SLOT_INDEX: "slotIndex must be between 0 and 10",
  INVALID_TIME_FORMAT: "openTime and closeTime must be HH:MM (24h)",
  SAME_DAY_REQUIRES_OPEN_BEFORE_CLOSE:
    "For same-day hours, open must be before close (use closesNextDay for overnight)",
  OVERNIGHT_REQUIRES_OPEN_AFTER_CLOSE_ON_CLOCK:
    "Overnight hours must have open later than close on the clock (e.g. 22:00–02:00)",
  DUPLICATE_OPENING_SLOT: "Duplicate dayOfWeek + slotIndex",
};

function openingHoursHttpMessage(err: unknown): string | null {
  if (!(err instanceof Error)) return null;
  return OPENING_HOUR_ERROR_MESSAGES[err.message] ?? null;
}

function parseOpeningHoursBody(raw: unknown): OpeningHourInput[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    throw new Error("INVALID_OPENING_HOURS");
  }
  const out: OpeningHourInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      throw new Error("INVALID_OPENING_HOURS");
    }
    const o = item as Record<string, unknown>;
    const dayOfWeek = Number(o.dayOfWeek ?? o.day_of_week);
    const slotIndex =
      o.slotIndex !== undefined || o.slot_index !== undefined
        ? Number(o.slotIndex ?? o.slot_index)
        : undefined;
    const openTime = String(o.openTime ?? o.open_time ?? "").trim();
    const closeTime = String(o.closeTime ?? o.close_time ?? "").trim();
    let closesNextDay = false;
    if (o.closesNextDay !== undefined || o.closes_next_day !== undefined) {
      const v = o.closesNextDay ?? o.closes_next_day;
      closesNextDay = v === true || v === 1 || v === "1";
    }
    out.push({
      dayOfWeek,
      slotIndex,
      openTime,
      closeTime,
      closesNextDay,
    });
  }
  return out;
}

function parseFacilityIds(raw: unknown): string[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    throw new Error("INVALID_FACILITY_IDS");
  }
  const ids = raw.map((x) => String(x).trim()).filter(Boolean);
  for (const id of ids) {
    if (!isUuid(id)) throw new Error("INVALID_FACILITY_IDS");
  }
  return ids;
}

export const BranchesController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = String(req.body.restaurantId ?? "").trim();
      if (!restaurantId || !isUuid(restaurantId)) {
        return res.status(400).json({
          success: false,
          message: "Valid restaurantId is required",
        });
      }

      const nameEn = String(req.body.nameEn ?? "").trim();
      const nameAr = String(req.body.nameAr ?? "").trim();
      if (!nameEn || !nameAr) {
        return res.status(400).json({
          success: false,
          message: "Both English and Arabic branch names are required",
        });
      }
      if (nameEn.length > MAX_NAME || nameAr.length > MAX_NAME) {
        return res.status(400).json({
          success: false,
          message: "Names must be at most 255 characters",
        });
      }

      let areaId: string | null | undefined;
      if (req.body.areaId !== undefined && req.body.areaId !== null && req.body.areaId !== "") {
        const aid = String(req.body.areaId).trim();
        if (!isUuid(aid)) {
          return res.status(400).json({
            success: false,
            message: "areaId must be a valid UUID",
          });
        }
        areaId = aid;
      } else if (req.body.areaId === null || req.body.areaId === "") {
        areaId = null;
      }

      const addressRaw = trimToNull(req.body.address);
      if (addressRaw && addressRaw.length > MAX_ADDRESS) {
        return res.status(400).json({
          success: false,
          message: "Address must be at most 500 characters",
        });
      }

      const latitude = trimToNull(req.body.latitude);
      const longitude = trimToNull(req.body.longitude);

      let costLevel: number | undefined;
      if (
        req.body.costLevel !== undefined &&
        req.body.costLevel !== null &&
        req.body.costLevel !== ""
      ) {
        const n = Number(req.body.costLevel);
        if (!Number.isInteger(n) || n < 1 || n > 5) {
          return res.status(400).json({
            success: false,
            message: "costLevel must be an integer from 1 to 5",
          });
        }
        costLevel = n;
      }

      let isOpen: number | undefined;
      if (req.body.isOpen !== undefined && req.body.isOpen !== null && req.body.isOpen !== "") {
        const n = Number(req.body.isOpen);
        if (n !== 0 && n !== 1) {
          return res.status(400).json({
            success: false,
            message: "isOpen must be 0 or 1",
          });
        }
        isOpen = n;
      }

      const openTimeRaw = trimToNull(req.body.openTime);
      if (openTimeRaw && openTimeRaw.length > MAX_TIME) {
        return res.status(400).json({
          success: false,
          message: "openTime must be at most 16 characters",
        });
      }
      const closeTimeRaw = trimToNull(req.body.closeTime);
      if (closeTimeRaw && closeTimeRaw.length > MAX_TIME) {
        return res.status(400).json({
          success: false,
          message: "closeTime must be at most 16 characters",
        });
      }

      let facilityIds: string[] | undefined;
      try {
        facilityIds = parseFacilityIds(req.body.facilityIds);
      } catch {
        return res.status(400).json({
          success: false,
          message: "facilityIds must be an array of valid UUIDs",
        });
      }

      let openingHours: OpeningHourInput[] | undefined;
      try {
        openingHours = parseOpeningHoursBody(req.body.openingHours);
      } catch {
        return res.status(400).json({
          success: false,
          message: "openingHours must be an array of { dayOfWeek, openTime, closeTime, closesNextDay?, slotIndex? }",
        });
      }

      try {
        const b = await BranchesService.create({
          restaurantId,
          areaId: areaId === undefined ? undefined : areaId,
          nameEn,
          nameAr,
          address: addressRaw ?? undefined,
          latitude: latitude ?? undefined,
          longitude: longitude ?? undefined,
          costLevel,
          isOpen,
          openTime: openTimeRaw ?? undefined,
          closeTime: closeTimeRaw ?? undefined,
          facilityIds,
          openingHours,
        });
        return res.status(201).json(b);
      } catch (e: unknown) {
        const friendly = openingHoursHttpMessage(e);
        if (friendly) {
          return res.status(400).json({ success: false, message: friendly });
        }
        throw e;
      }
    } catch (err) {
      next(err);
    }
  },

  async createBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const rawItems = req.body?.items ?? req.body;
      if (!Array.isArray(rawItems) || rawItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: "items must be a non-empty array",
        });
      }
      if (rawItems.length > 50) {
        return res.status(400).json({
          success: false,
          message: "At most 50 items per request",
        });
      }

      const items: CreateBranchDTO[] = [];
      for (let i = 0; i < rawItems.length; i++) {
        const raw = rawItems[i];
        if (!raw || typeof raw !== "object") {
          return res.status(400).json({
            success: false,
            message: `Item ${i}: invalid object`,
          });
        }
        const body = raw as Record<string, unknown>;
        const restaurantId = String(body.restaurantId ?? "").trim();
        if (!restaurantId || !isUuid(restaurantId)) {
          return res.status(400).json({
            success: false,
            message: `Item ${i}: valid restaurantId is required`,
          });
        }
        const nameEn = String(body.nameEn ?? "").trim();
        const nameAr = String(body.nameAr ?? "").trim();
        if (!nameEn || !nameAr) {
          return res.status(400).json({
            success: false,
            message: `Item ${i}: both English and Arabic names are required`,
          });
        }
        let areaId: string | null | undefined;
        if (body.areaId !== undefined && body.areaId !== null && body.areaId !== "") {
          const aid = String(body.areaId).trim();
          if (!isUuid(aid)) {
            return res.status(400).json({
              success: false,
              message: `Item ${i}: areaId must be a valid UUID`,
            });
          }
          areaId = aid;
        } else if (body.areaId === null || body.areaId === "") {
          areaId = null;
        }
        let costLevel: number | undefined;
        if (body.costLevel !== undefined && body.costLevel !== null && body.costLevel !== "") {
          const n = Number(body.costLevel);
          if (!Number.isInteger(n) || n < 1 || n > 5) {
            return res.status(400).json({
              success: false,
              message: `Item ${i}: costLevel must be an integer from 1 to 5`,
            });
          }
          costLevel = n;
        }
        items.push({
          restaurantId,
          nameEn,
          nameAr,
          areaId,
          address: trimToNull(body.address) ?? undefined,
          latitude: trimToNull(body.latitude) ?? undefined,
          longitude: trimToNull(body.longitude) ?? undefined,
          costLevel,
        });
      }

      const result = await BranchesService.createBulk(items);
      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const b = await BranchesService.findByIdWithOpeningHours(req.params.id);
      if (!b) return res.status(404).json({ message: "Not found" });
      return res.json(b);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as Record<string, string | undefined>;
      const { restaurantId, areaId } = q;
      const openAtWeekdayRaw = q.openAtWeekday ?? q.open_at_weekday;
      const openAtTimeRaw = q.openAtTime ?? q.open_at_time;

      let openAtWeekday: number | undefined;
      let openAtTimeMinutes: number | undefined;

      if (
        openAtWeekdayRaw !== undefined &&
        openAtWeekdayRaw !== "" &&
        openAtTimeRaw !== undefined &&
        openAtTimeRaw !== ""
      ) {
        const wd = Number.parseInt(String(openAtWeekdayRaw), 10);
        if (!Number.isInteger(wd) || wd < 1 || wd > 7) {
          return res.status(400).json({
            success: false,
            message: "openAtWeekday must be an integer 1 (Monday) through 7 (Sunday)",
          });
        }
        const t = trimToNull(openAtTimeRaw);
        if (!t) {
          return res.status(400).json({
            success: false,
            message: "openAtTime is required with openAtWeekday (HH:MM, 24h)",
          });
        }
        const mins = parseHmToMinutes(t);
        if (mins === null) {
          return res.status(400).json({
            success: false,
            message: "openAtTime must be HH:MM in 24-hour format",
          });
        }
        openAtWeekday = wd;
        openAtTimeMinutes = mins;
      } else if (
        (openAtWeekdayRaw !== undefined && openAtWeekdayRaw !== "") ||
        (openAtTimeRaw !== undefined && openAtTimeRaw !== "")
      ) {
        return res.status(400).json({
          success: false,
          message: "openAtWeekday and openAtTime must be sent together",
        });
      }

      const rows = await BranchesService.list(
        {
          restaurantId,
          areaId,
          openAtWeekday,
          openAtTimeMinutes,
        },
        Number(req.query.limit || 50),
        Number(req.query.offset || 0),
      );
      return res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as Record<string, unknown>;
      const dto: Parameters<typeof BranchesService.update>[1] = {};

      if (Object.prototype.hasOwnProperty.call(body, "restaurantId")) {
        const rid = String(body.restaurantId ?? "").trim();
        if (!isUuid(rid)) {
          return res.status(400).json({
            success: false,
            message: "restaurantId must be a valid UUID",
          });
        }
        dto.restaurantId = rid;
      }
      if (Object.prototype.hasOwnProperty.call(body, "areaId")) {
        if (body.areaId === null || body.areaId === "") {
          dto.areaId = null;
        } else {
          const aid = String(body.areaId).trim();
          if (!isUuid(aid)) {
            return res.status(400).json({
              success: false,
              message: "areaId must be a valid UUID",
            });
          }
          dto.areaId = aid;
        }
      }
      if (Object.prototype.hasOwnProperty.call(body, "nameEn")) {
        const nameEn = String(body.nameEn ?? "").trim();
        if (!nameEn) {
          return res.status(400).json({
            success: false,
            message: "English name cannot be empty",
          });
        }
        if (nameEn.length > MAX_NAME) {
          return res.status(400).json({
            success: false,
            message: "Names must be at most 255 characters",
          });
        }
        dto.nameEn = nameEn;
      }
      if (Object.prototype.hasOwnProperty.call(body, "nameAr")) {
        const nameAr = String(body.nameAr ?? "").trim();
        if (!nameAr) {
          return res.status(400).json({
            success: false,
            message: "Arabic name cannot be empty",
          });
        }
        if (nameAr.length > MAX_NAME) {
          return res.status(400).json({
            success: false,
            message: "Names must be at most 255 characters",
          });
        }
        dto.nameAr = nameAr;
      }
      if (Object.prototype.hasOwnProperty.call(body, "address")) {
        const addressRaw = trimToNull(body.address);
        if (addressRaw && addressRaw.length > MAX_ADDRESS) {
          return res.status(400).json({
            success: false,
            message: "Address must be at most 500 characters",
          });
        }
        dto.address = addressRaw;
      }
      if (Object.prototype.hasOwnProperty.call(body, "latitude")) {
        dto.latitude = trimToNull(body.latitude);
      }
      if (Object.prototype.hasOwnProperty.call(body, "longitude")) {
        dto.longitude = trimToNull(body.longitude);
      }
      if (Object.prototype.hasOwnProperty.call(body, "costLevel")) {
        if (body.costLevel === null || body.costLevel === "") {
          return res.status(400).json({
            success: false,
            message: "costLevel must be an integer from 1 to 5",
          });
        }
        const n = Number(body.costLevel);
        if (!Number.isInteger(n) || n < 1 || n > 5) {
          return res.status(400).json({
            success: false,
            message: "costLevel must be an integer from 1 to 5",
          });
        }
        dto.costLevel = n;
      }
      if (Object.prototype.hasOwnProperty.call(body, "isOpen")) {
        const n = Number(body.isOpen);
        if (n !== 0 && n !== 1) {
          return res.status(400).json({
            success: false,
            message: "isOpen must be 0 or 1",
          });
        }
        dto.isOpen = n;
      }
      if (Object.prototype.hasOwnProperty.call(body, "openTime")) {
        const t = trimToNull(body.openTime);
        if (t && t.length > MAX_TIME) {
          return res.status(400).json({
            success: false,
            message: "openTime must be at most 16 characters",
          });
        }
        dto.openTime = t;
      }
      if (Object.prototype.hasOwnProperty.call(body, "closeTime")) {
        const t = trimToNull(body.closeTime);
        if (t && t.length > MAX_TIME) {
          return res.status(400).json({
            success: false,
            message: "closeTime must be at most 16 characters",
          });
        }
        dto.closeTime = t;
      }

      const b = await BranchesService.update(req.params.id, dto);
      if (!b) return res.status(404).json({ message: "Not found" });
      return res.json(b);
    } catch (err) {
      next(err);
    }
  },

  async replaceOpeningHours(req: Request, res: Response, next: NextFunction) {
    try {
      let slots: OpeningHourInput[];
      try {
        const parsed = parseOpeningHoursBody(req.body.openingHours);
        if (!parsed) {
          return res.status(400).json({
            success: false,
            message: "openingHours array is required",
          });
        }
        slots = parsed;
      } catch {
        return res.status(400).json({
          success: false,
          message: "openingHours must be an array of { dayOfWeek, openTime, closeTime, closesNextDay?, slotIndex? }",
        });
      }

      try {
        const b = await BranchesService.replaceOpeningHours(req.params.id, slots);
        if (!b) return res.status(404).json({ message: "Not found" });
        return res.json(b);
      } catch (e: unknown) {
        const friendly = openingHoursHttpMessage(e);
        if (friendly) {
          return res.status(400).json({ success: false, message: friendly });
        }
        const msg = e instanceof Error ? e.message : "Invalid opening hours";
        return res.status(400).json({ success: false, message: msg });
      }
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const ok = await BranchesService.delete(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async listNearby(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng } = req.query as { lat?: string; lng?: string };
      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: "lat and lng query parameters are required",
        });
      }
      const latitude = Number.parseFloat(lat);
      const longitude = Number.parseFloat(lng);
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return res.status(400).json({
          success: false,
          message: "lat and lng must be valid numbers",
        });
      }

      const limit = Number(req.query.limit || 50);
      const offset = Number(req.query.offset || 0);
      const rows = await BranchesService.listNearby(latitude, longitude, limit, offset);

      return res.json({
        success: true,
        message: "Nearby branches retrieved successfully",
        data: rows,
      });
    } catch (err) {
      next(err);
    }
  },
};
