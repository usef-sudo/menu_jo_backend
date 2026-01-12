import { Request, Response, NextFunction } from "express";
import { RestaurantsService } from "./restaurants.service";

export const RestaurantsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body;
      const r = await RestaurantsService.create(dto);
      return res.status(201).json(r);
    } catch (err) { next(err); }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await RestaurantsService.findById(req.params.id);
      if (!r) return res.status(404).json({ message: "Not found" });
      return res.json(r);
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId, search } = req.query as any;
      const rows = await RestaurantsService.list({ categoryId, search }, Number(req.query.limit || 50), Number(req.query.offset || 0));
      return res.json(rows);
    } catch (err) { next(err); }
  },
};
