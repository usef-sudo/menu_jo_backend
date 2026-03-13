import { Request, Response, NextFunction } from "express";
import { FavoritesService } from "./favorites.service";

export const FavoritesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const rows = await FavoritesService.listByUser(userId);
      return res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  async add(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const restaurantId = req.params.restaurantId;
      if (!restaurantId) {
        return res
          .status(400)
          .json({ success: false, message: "restaurantId is required" });
      }
      await FavoritesService.add(userId, restaurantId);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const restaurantId = req.params.restaurantId;
      if (!restaurantId) {
        return res
          .status(400)
          .json({ success: false, message: "restaurantId is required" });
      }
      await FavoritesService.remove(userId, restaurantId);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};

