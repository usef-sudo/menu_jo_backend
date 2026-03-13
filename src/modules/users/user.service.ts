import { db } from "../../db/client";
import { users, refreshTokens } from "../../db/schema";
import { and, eq, isNull, gt } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface CreateUserDTO {
  name?: string;
  email: string;
  password: string; // include password for registration
  birthDate: string;
  gender: string;
  phoneNumber: string;
}

export const UsersService = {
  async create(dto: CreateUserDTO) {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const [row] = await db
      .insert(users)
      .values({
        name: dto.name ?? null,
        email: dto.email,
        password: hashedPassword,
        role: "user",
        birthDate: dto.birthDate ?? null,
        gender: dto.gender ?? null,
        phoneNumber: dto.phoneNumber ?? null,
      })
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

  async createRefreshToken(userId: string, token: string, expiresAt: Date) {
    const [row] = await db
      .insert(refreshTokens)
      .values({
        userId,
        token,
        expiresAt,
      })
      .returning();
    return row;
  },

  async rotateRefreshToken(oldToken: string) {
    const now = new Date();
    const existing = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, oldToken),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, now),
        ),
      )
      .then((rows) => rows[0] || null);

    if (!existing) {
      return null;
    }

    const crypto = await import("crypto");
    const newToken = crypto.randomUUID();

    const [updated] = await db
      .update(refreshTokens)
      .set({ token: newToken })
      .where(eq(refreshTokens.id, existing.id))
      .returning();

    const user = await this.findById(updated.userId);
    if (!user) return null;

    return { user, refreshToken: updated.token };
  },

  async revokeRefreshToken(token: string) {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.token, token));
  },
};
