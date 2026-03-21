import { Request, Response, NextFunction } from "express";
import { FacilitiesService } from "./facilities.service";

export const FacilitiesController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try { const r = await FacilitiesService.create(req.body); return res.status(201).json(r); } catch (err) { next(err); }
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
      const r = await FacilitiesService.update(req.params.id, req.body);
      if (!r) return res.status(404).json({ message: "Not found" });
      return res.json(r);
    } catch (err) { next(err); }
  },
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const ok = await FacilitiesService.delete(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      return res.status(204).send();
    } catch (err) { next(err); }
  },
};
