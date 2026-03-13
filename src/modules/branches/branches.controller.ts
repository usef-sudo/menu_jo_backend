import { Request, Response, NextFunction } from "express";
import { BranchesService } from "./branches.service";

export const BranchesController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body;
      const b = await BranchesService.create(dto);
      return res.status(201).json(b);
    } catch (err) { next(err); }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const b = await BranchesService.findById(req.params.id);
      if (!b) return res.status(404).json({ message: "Not found" });
      return res.json(b);
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { restaurantId, areaId } = req.query as any;
      const rows = await BranchesService.list(
        { restaurantId, areaId },
        Number(req.query.limit || 50),
        Number(req.query.offset || 0),
      );
      return res.json(rows);
    } catch (err) { next(err); }
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

