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
      const rows = await BranchesService.list({ restaurantId, areaId }, Number(req.query.limit || 50), Number(req.query.offset || 0));
      return res.json(rows);
    } catch (err) { next(err); }
  },
};

