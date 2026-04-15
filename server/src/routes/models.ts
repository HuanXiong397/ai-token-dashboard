import { Router, Request, Response } from 'express';
import db from '../db/database.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

/* ─── GET /api/models ─────────────────────── */
router.get('/', (_req: AuthRequest, res: Response) => {
  const rows = db.prepare('SELECT * FROM models ORDER BY id').all();
  res.json(rows);
});

/* ─── POST /api/models ────────────────────── */
router.post('/', requireAdmin, (req: Request, res: Response): void => {
  const { name, display_name, provider, input_price, cached_price, output_price } =
    req.body as Record<string, string | number>;

  if (!name || !display_name || !provider) {
    res.status(400).json({ error: '缺少必填字段：name, display_name, provider' });
    return;
  }
  try {
    const info = db.prepare(`
      INSERT INTO models (name, display_name, provider, input_price, cached_price, output_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, display_name, provider,
           Number(input_price) || 0,
           Number(cached_price) || 0,
           Number(output_price) || 0);
    res.status(201).json({ id: (info as { lastInsertRowid: number }).lastInsertRowid });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'ERR_SQLITE_ERROR') {
      res.status(409).json({ error: '模型名称已存在' });
    } else {
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
});

/* ─── PUT /api/models/:id ─────────────────── */
router.put('/:id', requireAdmin, (req: Request, res: Response) => {
  const { display_name, provider, input_price, cached_price, output_price, is_active } =
    req.body as Record<string, string | number>;

  db.prepare(`
    UPDATE models
    SET display_name=?, provider=?, input_price=?, cached_price=?, output_price=?, is_active=?
    WHERE id=?
  `).run(display_name, provider,
         Number(input_price), Number(cached_price), Number(output_price),
         is_active === undefined ? 1 : Number(is_active),
         req.params.id);
  res.json({ ok: true });
});

/* ─── DELETE /api/models/:id ─────────────── */
router.delete('/:id', requireAdmin, (req: Request, res: Response) => {
  db.prepare('DELETE FROM models WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

/* ─── POST /api/models/usage ─────────────── */
router.post('/usage', (req: Request, res: Response): void => {
  const {
    model_name, date, requests,
    input_tokens, cached_tokens, output_tokens,
  } = req.body as Record<string, string | number>;

  if (!model_name || !date) {
    res.status(400).json({ error: '缺少 model_name 或 date' });
    return;
  }

  const model = db.prepare('SELECT * FROM models WHERE name=?').get(model_name) as
    { id: number; input_price: number; cached_price: number; output_price: number } | undefined;

  if (!model) {
    res.status(404).json({ error: '模型不存在' });
    return;
  }

  const inp    = Number(input_tokens)   || 0;
  const cached = Number(cached_tokens)  || 0;
  const out    = Number(output_tokens)  || 0;
  const total  = inp + out;
  const standard = (inp / 1_000_000) * model.input_price +
                   (cached / 1_000_000) * model.cached_price +
                   (out / 1_000_000) * model.output_price;
  const actual = standard * 0.9;

  db.prepare(`
    INSERT INTO token_usage
      (model_id, date, requests, input_tokens, cached_tokens, output_tokens, total_tokens, actual_cost, standard_cost)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(model_id, date) DO UPDATE SET
      requests      = requests + excluded.requests,
      input_tokens  = input_tokens + excluded.input_tokens,
      cached_tokens = cached_tokens + excluded.cached_tokens,
      output_tokens = output_tokens + excluded.output_tokens,
      total_tokens  = total_tokens + excluded.total_tokens,
      actual_cost   = actual_cost + excluded.actual_cost,
      standard_cost = standard_cost + excluded.standard_cost
  `).run(model.id, date, Number(requests) || 1, inp, cached, out, total,
         Math.round(actual * 10000) / 10000,
         Math.round(standard * 10000) / 10000);

  res.status(201).json({ ok: true });
});

export default router;
