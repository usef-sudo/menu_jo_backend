import { Request, Response, NextFunction } from "express";
import { ReviewsService } from "./reviews.service";

export const ReviewsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId } = req.params;
      const limit = Number(req.query.limit ?? 20);
      const offset = Number(req.query.offset ?? 0);
      if (!branchId) {
        return res
          .status(400)
          .json({ success: false, message: "branchId is required" });
      }
      const data = await ReviewsService.listForBranch(branchId, limit, offset);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  },

  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const { branchId } = req.params;
      const { rating, comment } = req.body as {
        rating?: number;
        comment?: string;
      };
      if (!branchId) {
        return res
          .status(400)
          .json({ success: false, message: "branchId is required" });
      }
      if (rating === undefined || rating === null) {
        return res
          .status(400)
          .json({ success: false, message: "rating is required" });
      }
      const data = await ReviewsService.upsert(
        userId,
        branchId,
        Number(rating),
        comment,
      );
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};

