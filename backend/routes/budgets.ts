import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { budgetsRepository } from '../repositories/budgets';
import type { ApiResponse, BudgetWithStats } from '../../shared/types/api';

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

const setBudgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  totalBudget: z.coerce.number().positive(),
});

// GET /api/budgets/:month
router.get('/:month', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '未授权' });
    const month = req.params.month as string;
    const budget = await budgetsRepository.findByUserAndMonth(userId, month);
    const spent = await budgetsRepository.getSpentForMonth(userId, month);
    const totalBudget = budget?.totalBudget ?? '0';
    const spentNum = parseFloat(spent);
    const totalNum = parseFloat(totalBudget);
    const remaining = (totalNum - spentNum).toFixed(2);
    const spentPercent = totalNum > 0 ? Math.min(100, Math.round((spentNum / totalNum) * 100)) : 0;
    return res.json({
      success: true,
      data: {
        id: budget?.id ?? '',
        userId,
        month,
        totalBudget,
        totalSpent: spentNum.toFixed(2),
        remaining,
        spentPercent,
        createdAt: budget?.createdAt?.toISOString() ?? '',
        updatedAt: budget?.updatedAt?.toISOString() ?? '',
      },
    } as ApiResponse<BudgetWithStats>);
  } catch (error) {
    console.error('Error in GET /budgets/:month:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// POST /api/budgets
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '未授权' });
    const validated = setBudgetSchema.parse(req.body);
    const budget = await budgetsRepository.upsert(userId, validated.month, validated.totalBudget.toFixed(2));
    return res.json({
      success: true,
      data: { ...budget, createdAt: budget.createdAt.toISOString(), updatedAt: budget.updatedAt.toISOString() },
    });
  } catch (error) {
    console.error('Error in POST /budgets:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
