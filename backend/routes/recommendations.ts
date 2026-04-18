import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { recommendationsRepository } from '../repositories/recommendations';
import { expensesRepository } from '../repositories/expenses';
import type { ApiResponse, DailyRecommendation } from '../../shared/types/api';

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

async function buildRecommendationResponse(rec: any): Promise<DailyRecommendation> {
  const [breakfast, lunch, dinner] = await Promise.all([
    recommendationsRepository.getDishDetails(rec.breakfastDishId),
    recommendationsRepository.getDishDetails(rec.lunchDishId),
    recommendationsRepository.getDishDetails(rec.dinnerDishId),
  ]);
  return {
    id: rec.id,
    date: rec.date,
    breakfast: breakfast ? { id: breakfast.id, name: breakfast.name, price: breakfast.price, category: breakfast.category, imageUrl: breakfast.imageUrl } : null,
    lunch: lunch ? { id: lunch.id, name: lunch.name, price: lunch.price, category: lunch.category, imageUrl: lunch.imageUrl } : null,
    dinner: dinner ? { id: dinner.id, name: dinner.name, price: dinner.price, category: dinner.category, imageUrl: dinner.imageUrl } : null,
    breakfastConfirmed: rec.breakfastConfirmed,
    lunchConfirmed: rec.lunchConfirmed,
    dinnerConfirmed: rec.dinnerConfirmed,
  };
}

// GET /api/recommendations/:date
router.get('/:date', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '未授权' });
    const date = req.params.date as string;
    const rec = await recommendationsRepository.generateForDate(userId, date);
    const data = await buildRecommendationResponse(rec);
    return res.json({ success: true, data } as ApiResponse<DailyRecommendation>);
  } catch (error) {
    console.error('Error in GET /recommendations/:date:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// POST /api/recommendations/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '未授权' });
    const schema = z.object({
      mealType: z.enum(['breakfast', 'lunch', 'dinner']),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    });
    const { mealType, date } = schema.parse(req.body);
    const rec = await recommendationsRepository.refreshMeal(userId, date, mealType);
    if (!rec) return res.status(404).json({ success: false, message: '推荐记录不存在' });
    const data = await buildRecommendationResponse(rec);
    return res.json({ success: true, data } as ApiResponse<DailyRecommendation>);
  } catch (error) {
    console.error('Error in POST /recommendations/refresh:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// POST /api/recommendations/confirm
router.post('/confirm', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '未授权' });
    const schema = z.object({
      mealType: z.enum(['breakfast', 'lunch', 'dinner']),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    });
    const { mealType, date } = schema.parse(req.body);
    const rec = await recommendationsRepository.confirmMeal(userId, date, mealType);
    if (!rec) return res.status(404).json({ success: false, message: '推荐记录不存在' });

    // Auto-record expense when confirming a meal
    const dishField = mealType === 'breakfast' ? rec.breakfastDishId : mealType === 'lunch' ? rec.lunchDishId : rec.dinnerDishId;
    if (dishField) {
      const dish = await recommendationsRepository.getDishDetails(dishField);
      if (dish) {
        await expensesRepository.create(userId, {
          name: dish.name,
          amount: dish.price,
          mealType,
          date,
          dishId: dish.id,
        } as any);
      }
    }

    const data = await buildRecommendationResponse(rec);
    return res.json({ success: true, data } as ApiResponse<DailyRecommendation>);
  } catch (error) {
    console.error('Error in POST /recommendations/confirm:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
