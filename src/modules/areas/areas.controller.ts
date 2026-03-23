import { Request, Response, NextFunction } from "express";
import { AreasService } from "./areas.service";

const MAX_NAME = 255;

export const AreasController = {
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
      const r = await AreasService.create({ nameEn, nameAr });
      return res.status(201).json(r);
    } catch (err) {
      next(err);
    }
  },
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await AreasService.list();
      return res.json(r);
    } catch (err) {
      next(err);
    }
  },
  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await AreasService.findById(req.params.id);
      if (!r) return res.status(404).json({ message: "Not found" });
      return res.json(r);
    } catch (err) {
      next(err);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as Record<string, unknown>;
      const patch: { nameEn?: string; nameAr?: string } = {};

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

      const r = await AreasService.update(req.params.id, patch);
      if (!r) return res.status(404).json({ message: "Not found" });
      return res.json(r);
    } catch (err) {
      next(err);
    }
  },
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const ok = await AreasService.delete(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
