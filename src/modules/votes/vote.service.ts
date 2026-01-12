import { db } from "../../db/client";
import { branchVotes, branches } from "../../db/schema";
import { eq, and, sql } from "drizzle-orm";

export const VotesService = {
  async vote(userId: string, branchId: string, vote: number) {
    if (vote !== 1 && vote !== -1) {
      throw new Error("Vote must be 1 or -1");
    }

    // Check if vote already exists
    const existing = await db.select()
      .from(branchVotes)
      .where(and(
        eq(branchVotes.userId, userId),
        eq(branchVotes.branchId, branchId)
      ))
      .then((r) => r[0] || null);
    
    // Use transaction
    const result = await db.transaction(async (tx) => {
      if (!existing) {
        // Insert new vote
        const [newVote] = await tx.insert(branchVotes)
          .values({ 
            userId, 
            branchId, 
            vote 
          })
          .returning();
        
        // Update counters
        if (vote === 1) {
          await tx.update(branches)
            .set({ upVotes: sql`${branches.upVotes} + 1` })
            .where(eq(branches.id, branchId));
        } else {
          await tx.update(branches)
            .set({ downVotes: sql`${branches.downVotes} + 1` })
            .where(eq(branches.id, branchId));
        }
        
        return newVote;
      } else {
        // If same vote, return existing
        if (existing.vote === vote) {
          return existing;
        }
        
        // Update existing vote
        const [updatedVote] = await tx.update(branchVotes)
          .set({ vote })
          .where(eq(branchVotes.id, existing.id))
          .returning();
        
        // Adjust counters
        if (vote === 1 && existing.vote === -1) {
          await tx.update(branches)
            .set({ 
              upVotes: sql`${branches.upVotes} + 1`,
              downVotes: sql`${branches.downVotes} - 1`
            })
            .where(eq(branches.id, branchId));
        } else if (vote === -1 && existing.vote === 1) {
          await tx.update(branches)
            .set({ 
              downVotes: sql`${branches.downVotes} + 1`,
              upVotes: sql`${branches.upVotes} - 1`
            })
            .where(eq(branches.id, branchId));
        }
        
        return updatedVote;
      }
    });
    
    return result;
  },

  async counts(branchId: string) {
    const rows = await db.select()
      .from(branchVotes)
      .where(eq(branchVotes.branchId, branchId));
    
    const up = rows.filter((r) => r.vote === 1).length;
    const down = rows.filter((r) => r.vote === -1).length;
    
    return { up, down, score: up - down };
  },

  // FIXED: Changed to uppercase 'G' to match controller
  async getUserVote(userId: string, branchId: string) {
    return await db.select()
      .from(branchVotes)
      .where(and(
        eq(branchVotes.userId, userId),
        eq(branchVotes.branchId, branchId)
      ))
      .then((r) => r[0] || null);
  },

  async removeVote(userId: string, branchId: string) {
    const existing = await this.getUserVote(userId, branchId);
    if (!existing) return null;
    
    await db.transaction(async (tx) => {
      await tx.delete(branchVotes)
        .where(and(
          eq(branchVotes.userId, userId),
          eq(branchVotes.branchId, branchId)
        ));
      
      if (existing.vote === 1) {
        await tx.update(branches)
          .set({ upVotes: sql`${branches.upVotes} - 1` })
          .where(eq(branches.id, branchId));
      } else {
        await tx.update(branches)
          .set({ downVotes: sql`${branches.downVotes} - 1` })
          .where(eq(branches.id, branchId));
      }
    });
    
    return true;
  }
};