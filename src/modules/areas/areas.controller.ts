import { Request, Response, NextFunction } from "express";
import { AreasService } from "./areas.service";

export const AreasController = {
  async create(req: Request, res: Response, next: NextFunction) { try { const r = await AreasService.create(req.body); return res.status(201).json(r); } catch (err) { next(err); } },
  async list(req: Request, res: Response, next: NextFunction) { try { const r = await AreasService.list(); return res.json(r); } catch (err) { next(err); } }
};