import { db } from "../../db/client";
import { restaurantPhotos } from "../../db/schema";
import { and, asc, eq } from "drizzle-orm";
import { uploadService } from "../uploader/uploader.service";

export interface CreateRestaurantPhotoDTO {
  restaurantId: string;
  imageUrl: string;
  caption?: string;
  displayOrder?: number;
}

export const RestaurantPhotosService = {
  async create(dto: CreateRestaurantPhotoDTO) {
    const [row] = await db
      .insert(restaurantPhotos)
      .values({
        restaurantId: dto.restaurantId,
        imageUrl: dto.imageUrl,
        caption: dto.caption,
        displayOrder: dto.displayOrder ?? 0,
        isActive: 1,
      })
      .returning();
    return row;
  },

  async findByRestaurant(restaurantId: string, activeOnly = true) {
    const whereClause = activeOnly
      ? and(
          eq(restaurantPhotos.restaurantId, restaurantId),
          eq(restaurantPhotos.isActive, 1),
        )
      : eq(restaurantPhotos.restaurantId, restaurantId);

    return db
      .select()
      .from(restaurantPhotos)
      .where(whereClause)
      .orderBy(
        asc(restaurantPhotos.displayOrder),
        asc(restaurantPhotos.createdAt),
      );
  },

  async update(id: string, updates: Partial<CreateRestaurantPhotoDTO>) {
    const [row] = await db
      .update(restaurantPhotos)
      .set({
        ...(updates.imageUrl && { imageUrl: updates.imageUrl }),
        ...(updates.caption !== undefined && { caption: updates.caption }),
        ...(updates.displayOrder !== undefined && {
          displayOrder: updates.displayOrder,
        }),
      })
      .where(eq(restaurantPhotos.id, id))
      .returning();
    return row;
  },

  async delete(id: string) {
    await db.delete(restaurantPhotos).where(eq(restaurantPhotos.id, id));
    return true;
  },

  async deleteWithFile(id: string) {
    const rows = await db
      .select()
      .from(restaurantPhotos)
      .where(eq(restaurantPhotos.id, id));
    const photo = rows[0];
    if (!photo) return false;

    await uploadService.deleteFile(photo.imageUrl);
    await db.delete(restaurantPhotos).where(eq(restaurantPhotos.id, id));
    return true;
  },
};

