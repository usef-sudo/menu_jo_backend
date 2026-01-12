import { Request, Response, NextFunction } from "express";
import { OffersService } from "./offers.service";

export const OffersController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try { const r = await OffersService.create(req.body); return res.status(201).json(r); } catch (err) { next(err); }
  },
  async list(req: Request, res: Response, next: NextFunction) { try { const r = await OffersService.list(); return res.json(r); } catch (err) { next(err); } }
};

