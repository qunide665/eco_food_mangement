import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { expensesRepository } from '../repositories/expenses';
import { insertExpenseSchema } from '../db/schema';
import type { ApiResponse, Expense, ExpenseSummary } from '../../shared/types/api';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

function getUserId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

function mapExpense(e: any): Expense {
  return {
    id: e.id,
    userId: e.userId,
    dishId: e.dishId,
    name: e.name,
    amount: e.amount,
    mealType: e.mealType,
    date: e.date,
    note: e.note,
    createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
  };
}

// GET /api/expenses?month=YYYY-MM
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '未授权' });
    const month = req.query.month as string;
    if (!month) {
      const recent = await expensesRepository.findRecentByUser(userId, 20);
      return res.json({ success: true, data: recent.map(mapExpense) } as ApiResponse<Expense[]>);
    }
    const list = await expensesRepository.findByUserAndMonth(userId, month);
    return res.json({ success: true, data: list.map(mapExpense) } as ApiResponse<Expense[]>);
  } catch (error) {
    console.error('Error in GET /expenses:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/expenses/summary?month=YYYY-MM
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '未授权' });
    const month = req.query.month as string;
    if (!month) return res.status(400).json({ success: false, message: '缺少 month 参数' });
    const summary = await expensesRepository.getDailySummaryForMonth(userId, month);
    return res.json({ success: true, data: summary } as ApiResponse<ExpenseSummary[]>);
  } catch (error) {
    console.error('Error in GET /expenses/summary:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// POST /api/expenses
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '未授权' });
    const createSchema = z.object({
      name: z.string().min(1),
      amount: z.coerce.number().positive(),
      mealType: z.enum(['breakfast', 'lunch', 'dinner', 'other']),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      dishId: z.string().uuid().optional(),
      note: z.string().optional(),
    });
    const validated = createSchema.parse(req.body);
    const expense = await expensesRepository.create(userId, {
      ...validated,
      amount: validated.amount.toFixed(2),
    } as any);
    return res.status(201).json({ success: true, data: mapExpense(expense) } as ApiResponse<Expense>);
  } catch (error) {
    console.error('Error in POST /expenses:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// PUT /api/expenses/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '未授权' });
    const id = req.params.id as string;
    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      amount: z.coerce.number().positive().optional(),
      mealType: z.enum(['breakfast', 'lunch', 'dinner', 'other']).optional(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      note: z.string().optional(),
    });
    const validated = updateSchema.parse(req.body);
    const updateData: any = { ...validated };
    if (validated.amount !== undefined) updateData.amount = validated.amount.toFixed(2);
    const expense = await expensesRepository.update(id, userId, updateData);
    if (!expense) return res.status(404).json({ success: false, message: '记录不存在' });
    return res.json({ success: true, data: mapExpense(expense) } as ApiResponse<Expense>);
  } catch (error) {
    console.error('Error in PUT /expenses/:id:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '未授权' });
    const id = req.params.id as string;
    const deleted = await expensesRepository.delete(id, userId);
    if (!deleted) return res.status(404).json({ success: false, message: '记录不存在' });
    return res.json({ success: true, data: null, message: '删除成功' });
  } catch (error) {
    console.error('Error in DELETE /expenses/:id:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
