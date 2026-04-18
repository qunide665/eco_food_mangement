import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { dishesRepository } from '../repositories/dishes';
import { insertDishSchema } from '../db/schema';
import type { ApiResponse, Dish } from '../../shared/types/api';

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

function mapDish(d: any): Dish {
  return {
    id: d.id,
    userId: d.userId,
    name: d.name,
    price: d.price,
    category: d.category,
    imageUrl: d.imageUrl,
    isDefault: d.isDefault,
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt,
  };
}

// GET /api/dishes
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '未授权' });
    const allDishes = await dishesRepository.findAllForUser(userId);
    return res.json({ success: true, data: allDishes.map(mapDish) } as ApiResponse<Dish[]>);
  } catch (error) {
    console.error('Error in GET /dishes:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// POST /api/dishes
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '未授权' });
    const createSchema = z.object({
      name: z.string().min(1),
      price: z.coerce.number().positive(),
      category: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
      imageUrl: z.string().optional(),
    });
    const validated = createSchema.parse(req.body);
    const dish = await dishesRepository.create(userId, {
      ...validated,
      price: validated.price.toFixed(2),
    } as any);
    return res.status(201).json({ success: true, data: mapDish(dish) } as ApiResponse<Dish>);
  } catch (error) {
    console.error('Error in POST /dishes:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// PUT /api/dishes/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '未授权' });
    const id = req.params.id as string;
    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      price: z.coerce.number().positive().optional(),
      category: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
      imageUrl: z.string().optional(),
    });
    const validated = updateSchema.parse(req.body);
    const updateData: any = { ...validated };
    if (validated.price !== undefined) updateData.price = validated.price.toFixed(2);
    const dish = await dishesRepository.update(id, userId, updateData);
    if (!dish) return res.status(404).json({ success: false, message: '菜品不存在' });
    return res.json({ success: true, data: mapDish(dish) } as ApiResponse<Dish>);
  } catch (error) {
    console.error('Error in PUT /dishes/:id:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// DELETE /api/dishes/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '未授权' });
    const id = req.params.id as string;
    const deleted = await dishesRepository.delete(id, userId);
    if (!deleted) return res.status(404).json({ success: false, message: '菜品不存在或无权删除' });
    return res.json({ success: true, data: null, message: '删除成功' });
  } catch (error) {
    console.error('Error in DELETE /dishes/:id:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
