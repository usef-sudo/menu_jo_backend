import { db } from "../../db/client";
import { offers } from "../../db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm"; // Added necessary imports

export const OffersService = {
  async create(payload: any) {
    const [r] = await db.insert(offers).values(payload).returning();
    return r;
  },
  
  async list(activeOnly = true) {
    const now = new Date();
    
    if (activeOnly) {
      // Filter for active offers: startDate <= now <= endDate
      return await db.select()
        .from(offers)
        .where(and(
          lte(offers.startDate, now.toISOString()), // startDate <= now
          gte(offers.endDate, now.toISOString())     // endDate >= now
        ))
        .orderBy(desc(offers.startDate)); // Use desc() function
    }
    
    // Return all offers
    return await db.select()
      .from(offers)
      .orderBy(desc(offers.startDate)); // Use desc() function
  }
};