import { Request, Response, NextFunction } from "express";
import { RestaurantPhotosService } from "./restaurantPhotos.service";

export const RestaurantPhotosController = {
  async getByRestaurant(req: Request, res: Response, next: NextFunction) {
    try {
      const { restaurantId } = req.params;
      const activeOnly = req.query.active !== "false";

      const photos = await RestaurantPhotosService.findByRestaurant(
        restaurantId,
        activeOnly,
      );

      return res.status(200).json({
        success: true,
        message: "Restaurant photos retrieved successfully",
        data: photos,
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { restaurantId } = req.params;
      const { imageUrl, caption, displayOrder } = req.body;

      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          message: "imageUrl is required",
        });
      }

      const photo = await RestaurantPhotosService.create({
        restaurantId,
        imageUrl,
        caption,
        displayOrder:
          displayOrder !== undefined ? Number.parseInt(displayOrder, 10) : 0,
      });

      return res.status(201).json({
        success: true,
        message: "Restaurant photo created successfully",
        data: photo,
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const photo = await RestaurantPhotosService.update(id, updates);
      if (!photo) {
        return res.status(404).json({
          success: false,
          message: "Restaurant photo not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Restaurant photo updated successfully",
        data: photo,
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await RestaurantPhotosService.delete(id);
      return res.status(200).json({
        success: true,
        message: "Restaurant photo deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  },
};

