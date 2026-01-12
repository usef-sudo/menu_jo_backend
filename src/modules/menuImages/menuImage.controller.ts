

import { Request, Response, NextFunction } from "express";
import { MenuImagesService } from "./menuImage.service";
import { uploadService } from "../uploader/uploader.service";

export const MenuImagesController = {




  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId } = req.params;
      const { imageUrl, displayOrder } = req.body;

      if (!branchId || !imageUrl) {
        return res.status(400).json({
          success: false,
          message: "Branch ID and image URL are required"
        });
      }

      const image = await MenuImagesService.create({
        branchId,
        imageUrl,
        displayOrder: displayOrder ? parseInt(displayOrder) : undefined
      });

      return res.status(201).json({
        success: true,
        message: "Menu image uploaded successfully",
        data: image
      });
    } catch (err) {
      next(err);
    }
  },

  async uploadMultiple(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId } = req.params;
      const { images } = req.body; // Array of { imageUrl, displayOrder }

      if (!branchId || !Array.isArray(images)) {
        return res.status(400).json({
          success: false,
          message: "Branch ID and images array are required"
        });
      }

      const imagesWithBranchId = images.map(img => ({
        ...img,
        branchId
      }));

      const uploaded = await MenuImagesService.createMultiple(imagesWithBranchId);

      return res.status(201).json({
        success: true,
        message: `${uploaded.length} menu images uploaded successfully`,
        data: uploaded
      });
    } catch (err) {
      next(err);
    }
  },

  async getByBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId } = req.params;
      const activeOnly = req.query.active !== 'false'; // Default true

      const images = await MenuImagesService.findByBranch(branchId, activeOnly);

      return res.status(200).json({
        success: true,
        message: "Menu images retrieved successfully",
        data: images
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const image = await MenuImagesService.update(id, updates);

      if (!image) {
        return res.status(404).json({
          success: false,
          message: "Menu image not found"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Menu image updated successfully",
        data: image
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await MenuImagesService.delete(id);

      return res.status(200).json({
        success: true,
        message: "Menu image deleted successfully"
      });
    } catch (err) {
      next(err);
    }
  },

  async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId } = req.params;
      const { imageIds } = req.body; // Array of image IDs in desired order

      if (!Array.isArray(imageIds)) {
        return res.status(400).json({
          success: false,
          message: "imageIds must be an array"
        });
      }

      await MenuImagesService.reorder(branchId, imageIds);

      return res.status(200).json({
        success: true,
        message: "Menu images reordered successfully"
      });
    } catch (err) {
      next(err);
    }
  }







};