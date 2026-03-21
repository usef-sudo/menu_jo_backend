import { Request, Response, NextFunction } from "express";
import { BranchFacilitiesService } from "./branchFacilities.service";

export const BranchFacilitiesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId } = req.params;
      const ids = await BranchFacilitiesService.listAssigned(branchId);
      return res.json(ids);
    } catch (err) {
      next(err);
    }
  },

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId } = req.params;
      const { facilityIds } = req.body;
      if (!Array.isArray(facilityIds)) {
        return res.status(400).json({ message: "facilityIds must be an array" });
      }
      await BranchFacilitiesService.assign(branchId, facilityIds);
      return res.status(204).send();
    } catch (err) { next(err); }
  },

  async unassign(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId, facilityId } = req.params;
      await BranchFacilitiesService.unassign(branchId, facilityId);
      return res.status(204).send();
    } catch (err) { next(err); }
  }
};

