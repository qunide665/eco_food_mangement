import { db } from '../db';
import { dishes, insertDishSchema } from '../db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';
import { z } from 'zod';
import type { Dish, InsertDish } from '../db/schema';

export class DishesRepository {
  async findAllForUser(userId: string): Promise<Dish[]> {
    return db
      .select()
      .from(dishes)
      .where(or(eq(dishes.userId, userId), eq(dishes.isDefault, true)));
  }

  async findByCategory(userId: string, category: string): Promise<Dish[]> {
    return db
      .select()
      .from(dishes)
      .where(
        and(
          eq(dishes.category, category),
          or(eq(dishes.userId, userId), eq(dishes.isDefault, true))
        )
      );
  }

  async findById(id: string): Promise<Dish | null> {
    const result = await db.select().from(dishes).where(eq(dishes.id, id)).limit(1);
    return result[0] ?? null;
  }

  async create(userId: string, data: z.infer<typeof insertDishSchema>): Promise<Dish> {
    const result = await db
      .insert(dishes)
      .values({ ...data, userId, isDefault: false } as InsertDish)
      .returning();
    return result[0];
  }

  async update(id: string, userId: string, data: Partial<z.infer<typeof insertDishSchema>>): Promise<Dish | null> {
    const result = await db
      .update(dishes)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(dishes.id, id), eq(dishes.userId, userId)))
      .returning();
    return result[0] ?? null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(dishes)
      .where(and(eq(dishes.id, id), eq(dishes.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getRandomByCategory(userId: string, category: string): Promise<Dish | null> {
    const available = await this.findByCategory(userId, category);
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }
}

export const dishesRepository = new DishesRepository();
