import { Request, Response, NextFunction } from "express";
import { AreasService } from "./areas.service";

export const AreasController = {
  async create(req: Request, res: Response, next: NextFunction) { try { const r = await AreasService.create(req.body); return res.status(201).json(r); } catch (err) { next(err); } },
  async list(req: Request, res: Response, next: NextFunction) { try { const r = await AreasService.list(); return res.json(r); } catch (err) { next(err); } },
  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await AreasService.findById(req.params.id);
      if (!r) return res.status(404).json({ message: "Not found" });
      return res.json(r);
    } catch (err) { next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await AreasService.update(req.params.id, req.body);
      if (!r) return res.status(404).json({ message: "Not found" });
      return res.json(r);
    } catch (err) { next(err); }
  },
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const ok = await AreasService.delete(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      return res.status(204).send();
    } catch (err) { next(err); }
  },
};