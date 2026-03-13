import { pgTable, uuid, varchar, timestamp, text, date } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: text("password").notNull().default(""),
  role: varchar("role", { length: 32 }).notNull().default("user"),
  birthDate: date("birth_date"),
  gender: varchar("gender", { length: 32 }),
  phoneNumber: varchar("phone_number", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow(),
});
