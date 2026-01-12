import { Request, Response, NextFunction } from "express";
import { FacilitiesService } from "./facilities.service";

export const FacilitiesController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try { const r = await FacilitiesService.create(req.body); return res.status(201).json(r); } catch (err) { next(err); }
  },
  async list(req: Request, res: Response, next: NextFunction) { try { const r = await FacilitiesService.list(); return res.json(r); } catch (err) { next(err); } }
};
