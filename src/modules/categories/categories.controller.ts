
// src/modules/categories/category.controller.ts
import { Request, Response, NextFunction } from "express";
import { CategoriesService } from "./categories.service";
import { uploadService } from "../uploader/uploader.service";

export const CategoriesController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { nameEn, nameAr, descriptionEn, descriptionAr, icon, displayOrder, isActive } = req.body;
      
      if (!nameEn || !nameAr) {
        return res.status(400).json({
          success: false,
          message: "Both English and Arabic names are required"
        });
      }
      
      const category = await CategoriesService.create({
        nameEn,
        nameAr,
        descriptionEn: descriptionEn || null,
        descriptionAr: descriptionAr || null,
        icon: icon || null,
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
        isActive: isActive !== false, // Default true
      });
      
      return res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category
      });
    } catch (err) {
      next(err);
    }
  },

async createWithImage(req: Request, res: Response, next: NextFunction) {
  try {
    const upload = uploadService.uploadSingle("image");

    upload(req, res, async (err: any) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      const {
        nameEn,
        nameAr,
        descriptionEn,
        descriptionAr,
        icon,
        displayOrder,
        isActive,
      } = req.body;

      if (!nameEn || !nameAr) {
        if (req.file) {
          await uploadService.deleteFile((req.file as any).location);
        }
        return res.status(400).json({
          success: false,
          message: "Both English and Arabic names are required",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Category image is required",
        });
      }

      // ✅ FIXED parsing
      const parsedDisplayOrder = Number.isInteger(Number(displayOrder))
        ? Number(displayOrder)
        : 0;

      const parsedIsActive =
        typeof isActive === "string"
          ? isActive === "true"
          : isActive ?? true;

      try {
        const category = await CategoriesService.createWithImageUpload(
          {
            nameEn,
            nameAr,
            descriptionEn: descriptionEn || null,
            descriptionAr: descriptionAr || null,
            icon: icon || null,
            displayOrder: parsedDisplayOrder,
            isActive: parsedIsActive,
          },
          req.file as any
        );

        return res.status(201).json({
          success: true,
          message: "Category created with image successfully",
          data: category,
        });
      } catch (dbError) {
        await uploadService.deleteFile((req.file as any).location);
        next(dbError);
      }
    });
  } catch (err) {
    next(err);
  }
},


  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { lang } = req.query;
      const language = (lang === 'ar' ? 'ar' : 'en') as 'en' | 'ar';
      
      const category = await CategoriesService.findById(id);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found"
        });
      }
      
      // Format response based on language
      const formattedCategory = {
        id: category.id,
        name: language === 'ar' ? category.nameAr : category.nameEn,
        description: language === 'ar' ? category.descriptionAr : category.descriptionEn,
        icon: category.icon,
        imageUrl: category.imageUrl,
        isActive: category.isActive === 1,
        displayOrder: category.displayOrder,
        createdAt: category.createdAt,
        // Include both languages if needed
        ...(req.query.includeAll === 'true' && {
          nameEn: category.nameEn,
          nameAr: category.nameAr,
          descriptionEn: category.descriptionEn,
          descriptionAr: category.descriptionAr,
        })
      };
      
      return res.status(200).json({
        success: true,
        message: "Category retrieved successfully",
        data: formattedCategory
      });
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { lang = 'en', active = 'true', limit = '100', offset = '0' } = req.query;
      const language = (lang === 'ar' ? 'ar' : 'en') as 'en' | 'ar';
      const activeOnly = active !== 'false';
      const limitNum = parseInt(limit as string) || 100;
      const offsetNum = parseInt(offset as string) || 0;
      
      const categories = await CategoriesService.list(language, activeOnly, limitNum, offsetNum);
      
      return res.status(200).json({
        success: true,
        message: "Categories retrieved successfully",
        data: categories,
        pagination: {
          total: categories.length,
          limit: limitNum,
          offset: offsetNum
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, lang = 'en', limit = '50' } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          message: "Search query is required"
        });
      }
      
      const language = (lang === 'ar' ? 'ar' : 'en') as 'en' | 'ar';
      const limitNum = parseInt(limit as string) || 50;
      
      const results = await CategoriesService.search(q, language, limitNum);
      
      return res.status(200).json({
        success: true,
        message: "Search completed successfully",
        data: results
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const category = await CategoriesService.update(id, updates);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found"
        });
      }
      
      return res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: category
      });
    } catch (err) {
      next(err);
    }
  },

  async updateWithImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const upload = uploadService.uploadSingle('image');
      upload(req, res, async (err: any) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }

        try {
          const category = await CategoriesService.updateWithImageUpload(
            id,
            updates,
            req.file as any
          );

          if (!category) {
            return res.status(404).json({
              success: false,
              message: "Category not found"
            });
          }

          return res.status(200).json({
            success: true,
            message: "Category updated with image successfully",
            data: category
          });
        } catch (dbError) {
          next(dbError);
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      await CategoriesService.delete(id);
      
      return res.status(200).json({
        success: true,
        message: "Category deleted successfully"
      });
    } catch (err) {
      next(err);
    }
  },

  async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryIds } = req.body;
      
      if (!Array.isArray(categoryIds)) {
        return res.status(400).json({
          success: false,
          message: "categoryIds must be an array"
        });
      }
      
      await CategoriesService.reorder(categoryIds);
      
      return res.status(200).json({
        success: true,
        message: "Categories reordered successfully"
      });
    } catch (err) {
      next(err);
    }
  }
};