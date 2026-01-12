import { db } from "../../db/client";
import { branchFacilities } from "../../db/schema";
import { eq, and } from "drizzle-orm"; // Add these imports

export const BranchFacilitiesService = {
  async assign(branchId: string, facilityIds: string[]) {
    const pairs = facilityIds.map((f) => ({ branchId: branchId, facilityId: f }));
    await db.insert(branchFacilities).values(pairs).onConflictDoNothing();
    return true;
  },

  async unassign(branchId: string, facilityId: string) {
    // FIXED: Use eq() and and() functions instead of .eq() method
    await db.delete(branchFacilities)
      .where(and(
        eq(branchFacilities.branchId, branchId),
        eq(branchFacilities.facilityId, facilityId)
      ));
    return true;
  }
};