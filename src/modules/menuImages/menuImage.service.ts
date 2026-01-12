// src/modules/menuImages/menuImage.service.ts
import { db } from "../../db/client";
import { menuImages } from "../../db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { uploadService } from "../uploader/uploader.service";

export interface CreateMenuImageDTO {
  branchId: string;
  imageUrl: string;
  displayOrder?: number;
}

export const MenuImagesService = {

  async createMultiple(images: CreateMenuImageDTO[]) {
    const values = images.map(img => ({
      branchId: img.branchId,
      imageUrl: img.imageUrl,
      displayOrder: img.displayOrder ?? 0,
      isActive: 1
    }));

    return await db.insert(menuImages)
      .values(values)
      .returning();
  },

  async findByBranch(branchId: string, activeOnly = true) {
    const whereClause = activeOnly
      ? and(eq(menuImages.branchId, branchId), eq(menuImages.isActive, 1))
      : eq(menuImages.branchId, branchId);

    return await db.select()
      .from(menuImages)
      .where(whereClause)
      .orderBy(asc(menuImages.displayOrder), asc(menuImages.createdAt));
  },

  async findById(id: string) {
    return await db.select()
      .from(menuImages)
      .where(eq(menuImages.id, id))
      .then((r) => r[0] || null);
  },

  async update(id: string, updates: Partial<CreateMenuImageDTO>) {
    const [image] = await db.update(menuImages)
      .set({
        ...(updates.imageUrl && { imageUrl: updates.imageUrl }),
        ...(updates.displayOrder !== undefined && { displayOrder: updates.displayOrder }),
      })
      .where(eq(menuImages.id, id))
      .returning();
    return image;
  },

  async deactivate(id: string) {
    const [image] = await db.update(menuImages)
      .set({ isActive: 0 })
      .where(eq(menuImages.id, id))
      .returning();
    return image;
  },

  async delete(id: string) {
    await db.delete(menuImages)
      .where(eq(menuImages.id, id));
    return true;
  },

  async reorder(branchId: string, imageIdsInOrder: string[]) {
    // Update displayOrder based on array position
    const updates = imageIdsInOrder.map((id, index) =>
      db.update(menuImages)
        .set({ displayOrder: index + 1 })
        .where(and(
          eq(menuImages.id, id),
          eq(menuImages.branchId, branchId)
        ))
    );

    // Execute all updates
    await Promise.all(updates);
    return true;
  },




  async create(dto: CreateMenuImageDTO) {
    const [image] = await db.insert(menuImages)
      .values({
        branchId: dto.branchId,
        imageUrl: dto.imageUrl,
        displayOrder: dto.displayOrder ?? 0,
        isActive: 1
      })
      .returning();
    return image;
  },

  // New method: Upload and create in one go
  async uploadAndCreate(branchId: string, file: Express.MulterS3.File) {
    const imageUrl = uploadService.getPublicUrl(file);

    const [image] = await db.insert(menuImages)
      .values({
        branchId,
        imageUrl,
        displayOrder: await this.getNextDisplayOrder(branchId),
        isActive: 1
      })
      .returning();

    return image;
  },

  // New method: Upload multiple and create
  async uploadMultipleAndCreate(branchId: string, files: Express.MulterS3.File[]) {
    const nextOrder = await this.getNextDisplayOrder(branchId);

    const images = files.map((file, index) => ({
      branchId,
      imageUrl: uploadService.getPublicUrl(file),
      displayOrder: nextOrder + index,
      isActive: 1
    }));

    return await db.insert(menuImages)
      .values(images)
      .returning();
  },

  async getNextDisplayOrder(branchId: string): Promise<number> {
    const result = await db.select({ maxOrder: menuImages.displayOrder })
      .from(menuImages)
      .where(eq(menuImages.branchId, branchId))
      .orderBy(asc(menuImages.displayOrder))
      .limit(1);

    return result.length > 0 && result[0].maxOrder != null ? result[0].maxOrder + 1 : 1;
  },


  async deleteImageWithS3(id: string) {
    // Get the image first to get the URL
    const image = await this.findById(id);
    if (!image) return false;

    // Delete from S3
    await uploadService.deleteFile(image.imageUrl);

    // Delete from database
    await db.delete(menuImages)
      .where(eq(menuImages.id, id));

    return true;
  }

};




