import { pgTable, uuid, varchar, timestamp, text } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: text("password").notNull().default(""),
  role: varchar("role", { length: 32 }).notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});
