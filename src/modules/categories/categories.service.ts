

// src/modules/categories/category.service.ts
import { db } from "../../db/client";
import { categories } from "../../db/schema";
import { eq, asc, desc, sql } from "drizzle-orm";
import { uploadService } from "../uploader/uploader.service";



export interface CreateCategoryDTO {
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  icon?: string | null;
  imageUrl?: string | null; // For direct URL (if uploaded elsewhere)
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryDTO {
  nameEn?: string;
  nameAr?: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export const CategoriesService = {
  async create(dto: CreateCategoryDTO) {
    const [row] = await db.insert(categories)
      .values({
        nameEn: dto.nameEn,
        nameAr: dto.nameAr,
        descriptionEn: dto.descriptionEn ?? null,
        descriptionAr: dto.descriptionAr ?? null,
        icon: dto.icon ?? null,
        imageUrl: dto.imageUrl ?? null,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ? 1 : 0,
      })
      .returning();
    return row;
  },

  async createWithImageUpload(
    dto: Omit<CreateCategoryDTO, 'imageUrl'>,
    imageFile: Express.MulterS3.File
  ) {
    // Upload image to S3
    const imageUrl = uploadService.getPublicUrl(imageFile);
    
    const [row] = await db.insert(categories)
      .values({
        nameEn: dto.nameEn,
        nameAr: dto.nameAr,
        descriptionEn: dto.descriptionEn ?? null,
        descriptionAr: dto.descriptionAr ?? null,
        icon: dto.icon ?? null,
        imageUrl,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ? 1 : 0,
      })
      .returning();
    return row;
  },

  async findById(id: string) {
    return await db.select()
      .from(categories)
      .where(eq(categories.id, id))
      .then((r) => r[0] || null);
  },

  async list(language: 'en' | 'ar' = 'en', activeOnly = true, limit = 100, offset = 0) {
    const baseQuery = db.select({
      id: categories.id,
      name: language === 'ar' ? categories.nameAr : categories.nameEn,
      description: language === 'ar' ? categories.descriptionAr : categories.descriptionEn,
      icon: categories.icon,
      imageUrl: categories.imageUrl,
      isActive: categories.isActive,
      displayOrder: categories.displayOrder,
      createdAt: categories.createdAt,
    })
    .from(categories);

    const query = activeOnly
      ? baseQuery.where(eq(categories.isActive, 1))
      : baseQuery;

    return await query
      .orderBy(asc(categories.displayOrder), asc(categories.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async search(queryText: string, language: 'en' | 'ar' = 'en', limit = 50) {
    const nameField = language === 'ar' ? categories.nameAr : categories.nameEn;
    const descField = language === 'ar' ? categories.descriptionAr : categories.descriptionEn;
    
    return await db.select({
      id: categories.id,
      name: nameField,
      description: descField,
      icon: categories.icon,
      imageUrl: categories.imageUrl,
      isActive: categories.isActive,
      displayOrder: categories.displayOrder,
    })
    .from(categories)
    .where(
      sql`(LOWER(${nameField}) LIKE LOWER(${'%' + queryText + '%'}) OR 
           LOWER(${descField}) LIKE LOWER(${'%' + queryText + '%'})) AND 
           ${categories.isActive} = 1`
    )
    .orderBy(asc(categories.displayOrder))
    .limit(limit);
  },

  async update(id: string, updates: UpdateCategoryDTO) {
    const updateData: any = {};
    
    if (updates.nameEn !== undefined) updateData.nameEn = updates.nameEn;
    if (updates.nameAr !== undefined) updateData.nameAr = updates.nameAr;
    if (updates.descriptionEn !== undefined) updateData.descriptionEn = updates.descriptionEn;
    if (updates.descriptionAr !== undefined) updateData.descriptionAr = updates.descriptionAr;
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;
    if (updates.displayOrder !== undefined) updateData.displayOrder = updates.displayOrder;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive ? 1 : 0;
    
    updateData.updatedAt = new Date();
    
    const [row] = await db.update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();
    return row;
  },

  async updateWithImageUpload(id: string, updates: UpdateCategoryDTO, imageFile?: Express.MulterS3.File) {
    const updateData: any = { ...updates };
    
    if (imageFile) {
      // Delete old image if exists
      const category = await this.findById(id);
      if (category?.imageUrl) {
        await uploadService.deleteFile(category.imageUrl);
      }
      
      // Upload new image
      updateData.imageUrl = uploadService.getPublicUrl(imageFile);
    }
    
    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive ? 1 : 0;
    }
    
    updateData.updatedAt = new Date();
    
    const [row] = await db.update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();
    return row;
  },

  async delete(id: string) {
    // Delete image from S3 if exists
    const category = await this.findById(id);
    if (category?.imageUrl) {
      await uploadService.deleteFile(category.imageUrl);
    }
    
    await db.delete(categories)
      .where(eq(categories.id, id));
    return true;
  },

  async reorder(categoryIds: string[]) {
    const updates = categoryIds.map((id, index) => 
      db.update(categories)
        .set({ displayOrder: index + 1 })
        .where(eq(categories.id, id))
    );
    
    await Promise.all(updates);
    return true;
  }
};