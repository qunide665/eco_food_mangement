import { db } from '../db';
import { recommendations, dishes } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import type { Recommendation, InsertRecommendation } from '../db/schema';
import { dishesRepository } from './dishes';

export class RecommendationsRepository {
  async findByUserAndDate(userId: string, date: string): Promise<Recommendation | null> {
    const result = await db
      .select()
      .from(recommendations)
      .where(and(eq(recommendations.userId, userId), eq(recommendations.date, date)))
      .limit(1);
    return result[0] ?? null;
  }

  async generateForDate(userId: string, date: string): Promise<Recommendation> {
    const existing = await this.findByUserAndDate(userId, date);
    if (existing) return existing;

    const breakfast = await dishesRepository.getRandomByCategory(userId, 'breakfast');
    const lunch = await dishesRepository.getRandomByCategory(userId, 'lunch');
    const dinner = await dishesRepository.getRandomByCategory(userId, 'dinner');

    const result = await db
      .insert(recommendations)
      .values({
        userId,
        date,
        breakfastDishId: breakfast?.id ?? null,
        lunchDishId: lunch?.id ?? null,
        dinnerDishId: dinner?.id ?? null,
        breakfastConfirmed: false,
        lunchConfirmed: false,
        dinnerConfirmed: false,
      } as InsertRecommendation)
      .returning();
    return result[0];
  }

  async refreshMeal(userId: string, date: string, mealType: 'breakfast' | 'lunch' | 'dinner'): Promise<Recommendation | null> {
    const existing = await this.findByUserAndDate(userId, date);
    if (!existing) return null;

    const categoryMap = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner' };
    const newDish = await dishesRepository.getRandomByCategory(userId, categoryMap[mealType]);

    const updateData: Partial<InsertRecommendation> = {};
    if (mealType === 'breakfast') updateData.breakfastDishId = newDish?.id ?? null;
    if (mealType === 'lunch') updateData.lunchDishId = newDish?.id ?? null;
    if (mealType === 'dinner') updateData.dinnerDishId = newDish?.id ?? null;

    const result = await db
      .update(recommendations)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(recommendations.id, existing.id))
      .returning();
    return result[0] ?? null;
  }

  async confirmMeal(userId: string, date: string, mealType: 'breakfast' | 'lunch' | 'dinner'): Promise<Recommendation | null> {
    const existing = await this.findByUserAndDate(userId, date);
    if (!existing) return null;

    const updateData: Partial<InsertRecommendation> = {};
    if (mealType === 'breakfast') updateData.breakfastConfirmed = true;
    if (mealType === 'lunch') updateData.lunchConfirmed = true;
    if (mealType === 'dinner') updateData.dinnerConfirmed = true;

    const result = await db
      .update(recommendations)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(recommendations.id, existing.id))
      .returning();
    return result[0] ?? null;
  }

  async getDishDetails(dishId: string | null) {
    if (!dishId) return null;
    return dishesRepository.findById(dishId);
  }
}

export const recommendationsRepository = new RecommendationsRepository();
