import { db } from "../../db/client";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface CreateUserDTO {
  name?: string;
  email: string;
  password: string; // include password for registration
}

export const UsersService = {
  async create(dto: CreateUserDTO) {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const [row] = await db
      .insert(users)
      .values({ name: dto.name ?? null, email: dto.email, password: hashedPassword })
      .returning();
    return row;
  },

  async findById(id: string) {
    return await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .then((r) => r[0] || null);
  },

  async findByEmail(email: string) {
    return await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .then((r) => r[0] || null);
  },

  async list(limit = 50, offset = 0) {
    return await db.select().from(users).limit(limit).offset(offset);
  },

  async validateUser(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user) return null;

    // Compare provided password with hashed password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    return user;
  },
};
