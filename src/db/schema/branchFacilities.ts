import { pgTable, uuid, unique } from "drizzle-orm/pg-core";
import { branches } from "./branches";
import { facilities } from "./facilities";

export const branchFacilities = pgTable(
  "branch_facilities",
  {
    branchId: uuid("branch_id")
      .references(() => branches.id, { onDelete: "cascade" }),
    facilityId: uuid("facility_id")
      .references(() => facilities.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueFacility: unique("unique_branch_facility").on(
      table.branchId,
      table.facilityId
    ),
  })
);
