import { and, avg, count, desc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { reviews, users } from "../../db/schema";

export class ReviewsService {
  static async listForBranch(branchId: string, limit = 20, offset = 0) {
    const rows = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userId: users.id,
        userName: users.name,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.branchId, branchId))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);

    const [summary] = await db
      .select({
        avgRating: avg(reviews.rating),
        total: count(reviews.id),
      })
      .from(reviews)
      .where(eq(reviews.branchId, branchId));

    return {
      reviews: rows,
      summary: {
        avgRating: Number(summary?.avgRating ?? 0),
        total: Number(summary?.total ?? 0),
      },
    };
  }

  static async upsert(userId: string, branchId: string, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const existing = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.branchId, branchId)))
      .then((rows) => rows[0]);

    if (!existing) {
      const [row] = await db
        .insert(reviews)
        .values({
          userId,
          branchId,
          rating,
          comment: comment ?? null,
        })
        .returning();
      return row;
    }

    const [row] = await db
      .update(reviews)
      .set({
        rating,
        comment: comment ?? existing.comment,
      })
      .where(eq(reviews.id, existing.id))
      .returning();
    return row;
  }
}

