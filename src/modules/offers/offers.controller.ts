import { Request, Response, NextFunction } from "express";
import { OffersService } from "./offers.service";
import { isUuid, trimToNull } from "../shared/httpValidation";

const MAX_TITLE = 255;

export const OffersController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = String(req.body.restaurantId ?? "").trim();
      if (!isUuid(restaurantId)) {
        return res.status(400).json({
          success: false,
          message: "Valid restaurantId is required",
        });
      }
      const title = String(req.body.title ?? "").trim();
      if (!title) {
        return res.status(400).json({
          success: false,
          message: "Title is required",
        });
      }
      if (title.length > MAX_TITLE) {
        return res.status(400).json({
          success: false,
          message: "Title must be at most 255 characters",
        });
      }

      const imageUrl = trimToNull(req.body.imageUrl);
      if (imageUrl && imageUrl.length > 2048) {
        return res.status(400).json({
          success: false,
          message: "Image URL is too long",
        });
      }

      const r = await OffersService.create({
        restaurantId,
        title,
        description: trimToNull(req.body.description),
        imageUrl,
        startDate: trimToNull(req.body.startDate) ?? undefined,
        endDate: trimToNull(req.body.endDate) ?? undefined,
      });
      return res.status(201).json(r);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await OffersService.list(true);
      return res.json(r);
    } catch (err) {
      next(err);
    }
  },

  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const raw = req.query.restaurantId;
      const restaurantId =
        typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
      if (restaurantId && !isUuid(restaurantId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid restaurantId query parameter",
        });
      }
      const r = await OffersService.list(false, restaurantId);
      return res.json(r);
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await OffersService.findById(req.params.id);
      if (!r) return res.status(404).json({ message: "Not found" });
      return res.json(r);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await OffersService.update(req.params.id, req.body);
      if (!r) return res.status(404).json({ message: "Not found" });
      return res.json(r);
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const ok = await OffersService.delete(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
