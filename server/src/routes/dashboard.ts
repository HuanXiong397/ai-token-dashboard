import { Router, Response } from 'express';
import db from '../db/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

/* ─── GET /api/dashboard/summary ─────────────────────────── */
router.get('/summary', (_req: AuthRequest, res: Response) => {
  const today = new Date().toISOString().slice(0, 10);
  const d7    = new Date(Date.now() - 6  * 86400_000).toISOString().slice(0, 10);
  const d30   = new Date(Date.now() - 29 * 86400_000).toISOString().slice(0, 10);

  const query = db.prepare(`
    SELECT
      SUM(requests)       as total_requests,
      SUM(total_tokens)   as total_tokens,
      SUM(actual_cost)    as actual_cost,
      SUM(standard_cost)  as standard_cost
    FROM token_usage
    WHERE date BETWEEN ? AND ?
  `);

  res.json({
    today: query.get(today, today),
    week:  query.get(d7,    today),
    month: query.get(d30,   today),
  });
});

/* ─── GET /api/dashboard/trend?range=7|30 ─────────────────── */
router.get('/trend', (req: AuthRequest, res: Response) => {
  const range = parseInt((req.query.range as string) || '30', 10);
  const startDate = new Date(Date.now() - (range - 1) * 86400_000).toISOString().slice(0, 10);

  const rows = db.prepare(`
    SELECT
      date,
      SUM(total_tokens)  as tokens,
      SUM(requests)      as requests,
      SUM(actual_cost)   as cost
    FROM token_usage
    WHERE date >= ?
    GROUP BY date
    ORDER BY date ASC
  `).all(startDate);

  res.json(rows);
});

/* ─── GET /api/dashboard/models-usage?range=30 ─────────────── */
router.get('/models-usage', (req: AuthRequest, res: Response) => {
  const range = parseInt((req.query.range as string) || '30', 10);
  const startDate = new Date(Date.now() - (range - 1) * 86400_000).toISOString().slice(0, 10);

  const rows = db.prepare(`
    SELECT
      m.display_name            as model,
      SUM(tu.requests)          as requests,
      SUM(tu.total_tokens)      as total_tokens,
      SUM(tu.actual_cost)       as actual_cost,
      SUM(tu.standard_cost)     as standard_cost
    FROM token_usage tu
    JOIN models m ON m.id = tu.model_id
    WHERE tu.date >= ?
    GROUP BY tu.model_id
    ORDER BY total_tokens DESC
  `).all(startDate);

  res.json(rows);
});

/* ─── GET /api/dashboard/models-pricing ─────────────────────── */
router.get('/models-pricing', (_req: AuthRequest, res: Response) => {
  const rows = db.prepare(`
    SELECT display_name as title, provider, input_price, cached_price, output_price
    FROM models WHERE is_active = 1
    ORDER BY input_price DESC
  `).all();
  res.json(rows);
});

export default router;
