import { db } from '../db';
import { budgets, expenses } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { Budget, InsertBudget } from '../db/schema';

export class BudgetsRepository {
  async findByUserAndMonth(userId: string, month: string): Promise<Budget | null> {
    const result = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.month, month)))
      .limit(1);
    return result[0] ?? null;
  }

  async upsert(userId: string, month: string, totalBudget: string): Promise<Budget> {
    const existing = await this.findByUserAndMonth(userId, month);
    if (existing) {
      const result = await db
        .update(budgets)
        .set({ totalBudget, updatedAt: new Date() })
        .where(eq(budgets.id, existing.id))
        .returning();
      return result[0];
    }
    const result = await db
      .insert(budgets)
      .values({ userId, month, totalBudget } as InsertBudget)
      .returning();
    return result[0];
  }

  async getSpentForMonth(userId: string, month: string): Promise<string> {
    const result = await db
      .select({ total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses)
      .where(and(eq(expenses.userId, userId), sql`${expenses.date} LIKE ${month + '%'}`));
    return result[0]?.total ?? '0';
  }
}

export const budgetsRepository = new BudgetsRepository();
