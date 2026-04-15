import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body as { username: string; password: string };
  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as
    { id: number; username: string; password_hash: string; role: string } | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

// POST /api/auth/register
router.post('/register', (req: Request, res: Response): void => {
  const { username, password, email } = req.body as {
    username: string; password: string; email?: string;
  };
  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }
  try {
    const hash = bcrypt.hashSync(password, 10);
    const info = db.prepare(
      'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)'
    ).run(username, hash, email || null);
    res.status(201).json({ id: (info as { lastInsertRowid: number }).lastInsertRowid, username });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'ERR_SQLITE_ERROR') {
      res.status(409).json({ error: '用户名或邮箱已存在' });
    } else {
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
});

export default router;
