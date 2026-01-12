import { pgTable, uuid, timestamp, smallint, unique } from "drizzle-orm/pg-core";
import { users } from "./users";
import { branches } from "./branches";

export const branchVotes = pgTable(
  "branch_votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),

    vote: smallint("vote").notNull(), // +1 or -1
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    uniqueUserBranch: unique("unique_user_branch").on(
      table.userId,
      table.branchId
    ),
  })
);
