import { Request, Response, NextFunction } from "express";
import { RestaurantCategoriesService } from "./restaurantCategories.service";

export const RestaurantCategoriesController = {
  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const { restaurantId } = req.params;
      const { categoryIds } = req.body;
      if (!Array.isArray(categoryIds)) {
        return res.status(400).json({ message: "categoryIds must be an array of UUIDs" });
      }
      await RestaurantCategoriesService.assign(restaurantId, categoryIds);
      return res.status(204).send();
    } catch (err) { next(err); }
  },

  async unassign(req: Request, res: Response, next: NextFunction) {
    try {
      const { restaurantId, categoryId } = req.params;
      await RestaurantCategoriesService.unassign(restaurantId, categoryId);
      return res.status(204).send();
    } catch (err) { next(err); }
  }
};
