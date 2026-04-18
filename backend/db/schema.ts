import { pgTable, text, timestamp, numeric, uuid, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table
export const users = pgTable('Users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Budget records table
export const budgets = pgTable('Budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  month: text('month').notNull(), // format: YYYY-MM
  totalBudget: numeric('total_budget', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Dishes table
export const dishes = pgTable('Dishes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  category: text('category').notNull(), // breakfast, lunch, dinner, snack
  imageUrl: text('image_url'),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Expense records table
export const expenses = pgTable('Expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dishId: uuid('dish_id').references(() => dishes.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  mealType: text('meal_type').notNull(), // breakfast, lunch, dinner, other
  date: text('date').notNull(), // format: YYYY-MM-DD
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Daily recommendations table
export const recommendations = pgTable('Recommendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // format: YYYY-MM-DD
  breakfastDishId: uuid('breakfast_dish_id').references(() => dishes.id, { onDelete: 'set null' }),
  lunchDishId: uuid('lunch_dish_id').references(() => dishes.id, { onDelete: 'set null' }),
  dinnerDishId: uuid('dinner_dish_id').references(() => dishes.id, { onDelete: 'set null' }),
  breakfastConfirmed: boolean('breakfast_confirmed').default(false).notNull(),
  lunchConfirmed: boolean('lunch_confirmed').default(false).notNull(),
  dinnerConfirmed: boolean('dinner_confirmed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(1, '姓名不能为空'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位'),
});

export const insertBudgetSchema = createInsertSchema(budgets, {
  month: z.string().regex(/^\d{4}-\d{2}$/, '月份格式应为 YYYY-MM'),
  totalBudget: z.coerce.string(),
});

export const insertDishSchema = createInsertSchema(dishes, {
  name: z.string().min(1, '菜品名称不能为空'),
  price: z.coerce.string(),
  category: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
});

export const insertExpenseSchema = createInsertSchema(expenses, {
  name: z.string().min(1, '消费名称不能为空'),
  amount: z.coerce.string(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'other']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;
export type Dish = typeof dishes.$inferSelect;
export type InsertDish = typeof dishes.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;
export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = typeof recommendations.$inferInsert;
