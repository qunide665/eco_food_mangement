import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { usersRepository } from '../repositories/users';
import { insertUserSchema } from '../db/schema';
import type { ApiResponse, AuthResponse, User } from '../../shared/types/api';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = insertUserSchema.pick({ name: true, email: true, password: true });

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const validated = signupSchema.parse(req.body);
    const existing = await usersRepository.findByEmail(validated.email);
    if (existing) {
      return res.status(400).json({ success: false, message: '该邮箱已被注册' } as ApiResponse<null>);
    }
    const user = await usersRepository.create(validated);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({
      success: true,
      data: { token, user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt.toISOString() } },
    } as ApiResponse<AuthResponse>);
  } catch (error) {
    console.error('Error in signup:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validated = loginSchema.parse(req.body);
    const user = await usersRepository.findByEmail(validated.email);
    if (!user) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' });
    }
    const valid = await usersRepository.verifyPassword(user, validated.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      success: true,
      data: { token, user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt.toISOString() } },
    } as ApiResponse<AuthResponse>);
  } catch (error) {
    console.error('Error in login:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未授权' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await usersRepository.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    return res.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt.toISOString() },
    } as ApiResponse<User>);
  } catch (error) {
    console.error('Error in /me:', error);
    return res.status(401).json({ success: false, message: '无效令牌' });
  }
});

// PUT /api/auth/profile
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未授权' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { name, email } = req.body;
    if (email) {
      const existing = await usersRepository.findByEmail(email);
      if (existing && existing.id !== decoded.userId) {
        return res.status(400).json({ success: false, message: '该邮箱已被使用' });
      }
    }
    const user = await usersRepository.updateProfile(decoded.userId, { name, email });
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    return res.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt.toISOString() },
    } as ApiResponse<User>);
  } catch (error) {
    console.error('Error in update profile:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// PUT /api/auth/password
router.put('/password', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未授权' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '密码参数错误' });
    }
    const user = await usersRepository.findById(decoded.userId);
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    const valid = await usersRepository.verifyPassword(user, currentPassword);
    if (!valid) return res.status(400).json({ success: false, message: '当前密码错误' });
    await usersRepository.updatePassword(decoded.userId, newPassword);
    return res.json({ success: true, data: null, message: '密码修改成功' });
  } catch (error) {
    console.error('Error in change password:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
