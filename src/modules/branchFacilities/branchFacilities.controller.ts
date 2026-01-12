import { Request, Response, NextFunction } from "express";
import { BranchFacilitiesService } from "./branchFacilities.service";

export const BranchFacilitiesController = {
  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId } = req.params;
      const { facilityIds } = req.body;
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

