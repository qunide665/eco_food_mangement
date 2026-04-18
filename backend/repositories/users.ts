import { db } from '../db';
import { users, insertUserSchema } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { User, InsertUser } from '../db/schema';
import bcrypt from 'bcryptjs';

export class UsersRepository {
  async findByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] ?? null;
  }

  async create(userData: z.infer<typeof insertUserSchema>): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const result = await db
      .insert(users)
      .values({ ...userData, password: hashedPassword } as InsertUser)
      .returning();
    return result[0];
  }

  async updateProfile(id: string, data: { name?: string; email?: string }): Promise<User | null> {
    const result = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0] ?? null;
  }

  async updatePassword(id: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result.length > 0;
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}

export const usersRepository = new UsersRepository();
