import { Request, Response, NextFunction } from "express";
import { RestaurantsService } from "./restaurants.service";
import { isUuid, trimToNull } from "../shared/httpValidation";

const MAX_NAME = 255;
const MAX_PHONE = 20;
const MAX_LOGO_URL = 2048;
const MAX_LINK_URL = 2048;

function parseOptionalLink(
  body: Record<string, unknown>,
  key: string,
): { ok: true; value?: string | null } | { ok: false; message: string } {
  if (!Object.prototype.hasOwnProperty.call(body, key)) {
    return { ok: true };
  }
  const raw = trimToNull(body[key]);
  if (raw && raw.length > MAX_LINK_URL) {
    return { ok: false, message: `${key} is too long` };
  }
  return { ok: true, value: raw };
}

function parseCategoryIds(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const ids = raw.map((x) => String(x).trim()).filter(Boolean);
  for (const id of ids) {
    if (!isUuid(id)) {
      throw new Error("INVALID_CATEGORY_ID");
    }
  }
  return ids.length ? ids : [];
}

export const RestaurantsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const nameEn = String(req.body.nameEn ?? "").trim();
      const nameAr = String(req.body.nameAr ?? "").trim();
      if (!nameEn || !nameAr) {
        return res.status(400).json({
          success: false,
          message: "Both English and Arabic names are required",
        });
      }
      if (nameEn.length > MAX_NAME || nameAr.length > MAX_NAME) {
        return res.status(400).json({
          success: false,
          message: "Names must be at most 255 characters",
        });
      }

      const descriptionEn = trimToNull(req.body.descriptionEn);
      const descriptionAr = trimToNull(req.body.descriptionAr);
      const phoneRaw = trimToNull(req.body.phone);
      if (phoneRaw && phoneRaw.length > MAX_PHONE) {
        return res.status(400).json({
          success: false,
          message: "Phone must be at most 20 characters",
        });
      }
      const logoRaw = trimToNull(req.body.logoUrl);
      if (logoRaw && logoRaw.length > MAX_LOGO_URL) {
        return res.status(400).json({
          success: false,
          message: "Logo URL is too long",
        });
      }

      let categoryIds: string[] | undefined;
      try {
        categoryIds = parseCategoryIds(req.body.categoryIds);
      } catch {
        return res.status(400).json({
          success: false,
          message: "categoryIds must be an array of valid UUIDs",
        });
      }

      const linkKeys = [
        "websiteUrl",
        "instagramUrl",
        "facebookUrl",
        "talabatUrl",
        "careemUrl",
      ] as const;
      const links: Record<string, string | null | undefined> = {};
      for (const key of linkKeys) {
        const parsed = parseOptionalLink(req.body as Record<string, unknown>, key);
        if (!parsed.ok) {
          return res.status(400).json({ success: false, message: parsed.message });
        }
        if (parsed.value !== undefined) links[key] = parsed.value;
      }

      const r = await RestaurantsService.create({
        nameEn,
        nameAr,
        descriptionEn,
        descriptionAr,
        logoUrl: logoRaw,
        phone: phoneRaw,
        websiteUrl: links.websiteUrl ?? null,
        instagramUrl: links.instagramUrl ?? null,
        facebookUrl: links.facebookUrl ?? null,
        talabatUrl: links.talabatUrl ?? null,
        careemUrl: links.careemUrl ?? null,
        categoryIds,
      });
      return res.status(201).json(r);
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

      const items: Parameters<typeof RestaurantsService.create>[0][] = [];
      for (let i = 0; i < rawItems.length; i++) {
        const raw = rawItems[i];
        if (!raw || typeof raw !== "object") {
          return res.status(400).json({
            success: false,
            message: `Item ${i}: invalid object`,
          });
        }
        const body = raw as Record<string, unknown>;
        const nameEn = String(body.nameEn ?? "").trim();
        const nameAr = String(body.nameAr ?? "").trim();
        if (!nameEn || !nameAr) {
          return res.status(400).json({
            success: false,
            message: `Item ${i}: both English and Arabic names are required`,
          });
        }
        if (nameEn.length > MAX_NAME || nameAr.length > MAX_NAME) {
          return res.status(400).json({
            success: false,
            message: `Item ${i}: names must be at most 255 characters`,
          });
        }
        const phoneRaw = trimToNull(body.phone);
        if (phoneRaw && phoneRaw.length > MAX_PHONE) {
          return res.status(400).json({
            success: false,
            message: `Item ${i}: phone must be at most 20 characters`,
          });
        }
        items.push({
          nameEn,
          nameAr,
          descriptionEn: trimToNull(body.descriptionEn),
          descriptionAr: trimToNull(body.descriptionAr),
          phone: phoneRaw,
          logoUrl: trimToNull(body.logoUrl),
        });
      }

      const result = await RestaurantsService.createBulk(items);
      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await RestaurantsService.findById(req.params.id);
      if (!r) return res.status(404).json({ message: "Not found" });
      return res.json(r);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        categoryId,
        search,
        minCostLevel,
        maxCostLevel,
        openOnly,
        sort,
      } = req.query as any;

      const rawFacilities = req.query.facilityIds as string | string[] | undefined;
      const facilityIds =
        typeof rawFacilities === "string"
          ? rawFacilities.split(",").filter(Boolean)
          : Array.isArray(rawFacilities)
            ? rawFacilities
            : undefined;

      const rows = await RestaurantsService.list(
        {
          categoryId,
          search,
          minCostLevel: minCostLevel ? Number(minCostLevel) : undefined,
          maxCostLevel: maxCostLevel ? Number(maxCostLevel) : undefined,
          openOnly: openOnly === "true",
          sort,
          facilityIds,
        },
        Number(req.query.limit || 50),
        Number(req.query.offset || 0),
      );
      return res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  async getDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await RestaurantsService.getDetails(req.params.id);
      if (!r) return res.status(404).json({ message: "Not found" });
      return res.json(r);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as Record<string, unknown>;
      const dto: Parameters<typeof RestaurantsService.update>[1] = {};

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
      if (Object.prototype.hasOwnProperty.call(body, "descriptionEn")) {
        dto.descriptionEn = trimToNull(body.descriptionEn);
      }
      if (Object.prototype.hasOwnProperty.call(body, "descriptionAr")) {
        dto.descriptionAr = trimToNull(body.descriptionAr);
      }
      if (Object.prototype.hasOwnProperty.call(body, "logoUrl")) {
        const logoRaw = trimToNull(body.logoUrl);
        if (logoRaw && logoRaw.length > MAX_LOGO_URL) {
          return res.status(400).json({
            success: false,
            message: "Logo URL is too long",
          });
        }
        dto.logoUrl = logoRaw;
      }
      if (Object.prototype.hasOwnProperty.call(body, "phone")) {
        const phoneRaw = trimToNull(body.phone);
        if (phoneRaw && phoneRaw.length > MAX_PHONE) {
          return res.status(400).json({
            success: false,
            message: "Phone must be at most 20 characters",
          });
        }
        dto.phone = phoneRaw;
      }
      for (const key of [
        "websiteUrl",
        "instagramUrl",
        "facebookUrl",
        "talabatUrl",
        "careemUrl",
      ] as const) {
        const parsed = parseOptionalLink(body, key);
        if (!parsed.ok) {
          return res.status(400).json({ success: false, message: parsed.message });
        }
        if (parsed.value !== undefined) {
          dto[key] = parsed.value;
        }
      }
      if (Object.prototype.hasOwnProperty.call(body, "categoryIds")) {
        try {
          dto.categoryIds = parseCategoryIds(body.categoryIds);
        } catch {
          return res.status(400).json({
            success: false,
            message: "categoryIds must be an array of valid UUIDs",
          });
        }
      }

      const r = await RestaurantsService.update(req.params.id, dto);
      if (!r) return res.status(404).json({ message: "Not found" });
      return res.json(r);
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const ok = await RestaurantsService.delete(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
