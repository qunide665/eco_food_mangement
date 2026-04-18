import { db } from '../db';
import { expenses, insertExpenseSchema } from '../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { z } from 'zod';
import type { Expense, InsertExpense } from '../db/schema';

export class ExpensesRepository {
  async findByUserAndDate(userId: string, date: string): Promise<Expense[]> {
    return db
      .select()
      .from(expenses)
      .where(and(eq(expenses.userId, userId), eq(expenses.date, date)))
      .orderBy(desc(expenses.createdAt));
  }

  async findByUserAndMonth(userId: string, month: string): Promise<Expense[]> {
    return db
      .select()
      .from(expenses)
      .where(and(eq(expenses.userId, userId), sql`${expenses.date} LIKE ${month + '%'}`))
      .orderBy(desc(expenses.date));
  }

  async findRecentByUser(userId: string, limit: number = 10): Promise<Expense[]> {
    return db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.createdAt))
      .limit(limit);
  }

  async create(userId: string, data: z.infer<typeof insertExpenseSchema>): Promise<Expense> {
    const result = await db
      .insert(expenses)
      .values({ ...data, userId } as InsertExpense)
      .returning();
    return result[0];
  }

  async update(id: string, userId: string, data: Partial<z.infer<typeof insertExpenseSchema>>): Promise<Expense | null> {
    const result = await db
      .update(expenses)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();
    return result[0] ?? null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getDailySummaryForMonth(userId: string, month: string): Promise<{ date: string; total: string; count: number }[]> {
    const result = await db
      .select({
        date: expenses.date,
        total: sql<string>`SUM(${expenses.amount})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(expenses)
      .where(and(eq(expenses.userId, userId), sql`${expenses.date} LIKE ${month + '%'}`))
      .groupBy(expenses.date)
      .orderBy(expenses.date);
    return result;
  }
}

export const expensesRepository = new ExpensesRepository();
