import { Request, Response, NextFunction } from "express";
import { FacilitiesService } from "./facilities.service";

const MAX_NAME = 255;
const MAX_ICON = 255;

function parseIcon(body: Record<string, unknown>): string | null | undefined {
  if (!Object.prototype.hasOwnProperty.call(body, "icon")) return undefined;
  const raw = body.icon;
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (s.length > MAX_ICON) {
    throw Object.assign(new Error("ICON_TOO_LONG"), { status: 400 });
  }
  return s === "" ? null : s;
}

export const FacilitiesController = {
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
      let icon: string | null | undefined;
      try {
        icon = parseIcon(req.body as Record<string, unknown>);
      } catch (e: any) {
        if (e?.message === "ICON_TOO_LONG") {
          return res.status(400).json({
            success: false,
            message: "Icon must be at most 255 characters",
          });
        }
        throw e;
      }
      const r = await FacilitiesService.create({
        nameEn,
        nameAr,
        ...(icon !== undefined ? { icon } : {}),
      });
      return res.status(201).json(r);
    } catch (err) {
      next(err);
    }
  },
  async list(req: Request, res: Response, next: NextFunction) { try { const r = await FacilitiesService.list(); return res.json(r); } catch (err) { next(err); } },
  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await FacilitiesService.findById(req.params.id);
      if (!r) return res.status(404).json({ message: "Not found" });
      return res.json(r);
    } catch (err) { next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as Record<string, unknown>;
      const patch: { nameEn?: string; nameAr?: string; icon?: string | null } =
        {};

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
        patch.nameEn = nameEn;
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
        patch.nameAr = nameAr;
      }
      if (Object.prototype.hasOwnProperty.call(body, "icon")) {
        try {
          const parsed = parseIcon(body);
          patch.icon = parsed === undefined ? null : parsed;
        } catch (e: any) {
          if (e?.message === "ICON_TOO_LONG") {
            return res.status(400).json({
              success: false,
              message: "Icon must be at most 255 characters",
            });
          }
          throw e;
        }
      }

      const r = await FacilitiesService.update(req.params.id, patch);
      if (!r) return res.status(404).json({ message: "Not found" });
      return res.json(r);
    } catch (err) {
      next(err);
    }
  },
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const ok = await FacilitiesService.delete(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      return res.status(204).send();
    } catch (err) { next(err); }
  },
};
