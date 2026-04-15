import { prepare, exec } from './database.js';
import bcrypt from 'bcryptjs';

console.log('🌱 开始初始化数据库种子数据...');

// ---------- 用户 ----------
const adminPwd = bcrypt.hashSync('admin123', 10);
const insertUser = prepare(`
  INSERT OR IGNORE INTO users (username, password_hash, email, role)
  VALUES (?, ?, ?, ?)
`);
insertUser.run('admin', adminPwd, 'admin@example.com', 'admin');
insertUser.run('demo', bcrypt.hashSync('demo123', 10), 'demo@example.com', 'user');
console.log('✅ 用户数据已写入');

// ---------- 模型 ----------
const insertModel = prepare(`
  INSERT OR IGNORE INTO models (name, display_name, provider, input_price, cached_price, output_price)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const models = [
  ['gpt-5.4',          'GPT-5.4',            'OpenAI',    2.50,  0.25,   15.00],
  ['claude-opus-4.6',  'Claude Opus 4.6',    'Anthropic', 15.00, 1.50,   75.00],
  ['gpt-5.2',          'GPT-5.2',            'OpenAI',    0.50,  0.05,    1.50],
  ['gpt-5.2-codex',    'GPT-5.2 Codex',      'OpenAI',    0.75,  0.075,   4.00],
  ['glm-5.15.4',       'GLM-5.15.4',         'Zhipu',     0.10,  0.01,    0.10],
  ['glm-4.6',          'GLM-4.6',            'Zhipu',     0.05,  0.005,   0.05],
];
for (const m of models) insertModel.run(...m);
console.log('✅ 模型数据已写入');

// ---------- 使用记录（近 30 天模拟数据） ----------
const modelRows = prepare('SELECT id, name FROM models').all() as {id:number; name:string}[];
const insertUsage = prepare(`
  INSERT OR REPLACE INTO token_usage
    (model_id, date, requests, input_tokens, cached_tokens, output_tokens, total_tokens, actual_cost, standard_cost)
  VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const usageConfig: Record<string, {reqBase:number; tokBase:number; inputPrice:number; outputPrice:number}> = {
  'gpt-5.4':         { reqBase: 800,  tokBase: 160_000_000, inputPrice: 2.50,  outputPrice: 15.00 },
  'claude-opus-4.6': { reqBase: 330,  tokBase:  60_000_000, inputPrice: 15.00, outputPrice: 75.00 },
  'gpt-5.2':         { reqBase: 152,  tokBase:   4_800_000, inputPrice: 0.50,  outputPrice: 1.50  },
  'gpt-5.2-codex':   { reqBase:  16,  tokBase:     346_000, inputPrice: 0.75,  outputPrice: 4.00  },
  'glm-5.15.4':      { reqBase:  13,  tokBase:   3_180_000, inputPrice: 0.10,  outputPrice: 0.10  },
  'glm-4.6':         { reqBase:   3,  tokBase:     936_000, inputPrice: 0.05,  outputPrice: 0.05  },
};

for (let i = 0; i < 30; i++) {
  const d = new Date();
  d.setDate(d.getDate() - i);
  const dateStr = d.toISOString().slice(0, 10);

  for (const m of modelRows) {
    const cfg = usageConfig[m.name];
    if (!cfg) continue;
    const requests     = rnd(Math.floor(cfg.reqBase * 0.6), Math.floor(cfg.reqBase * 1.4));
    const totalTokens  = rnd(Math.floor(cfg.tokBase * 0.7), Math.floor(cfg.tokBase * 1.3));
    const inputTokens  = Math.floor(totalTokens * 0.65);
    const cachedTokens = Math.floor(inputTokens * 0.15);
    const outputTokens = totalTokens - inputTokens;

    const standardCost = (inputTokens / 1_000_000) * cfg.inputPrice +
                         (outputTokens / 1_000_000) * cfg.outputPrice;
    const actualCost   = standardCost * rnd(75, 95) / 100;

    insertUsage.run(
      m.id, dateStr, requests,
      inputTokens, cachedTokens, outputTokens, totalTokens,
      Math.round(actualCost * 100) / 100,
      Math.round(standardCost * 100) / 100,
    );
  }
}
console.log('✅ 30 天使用记录已写入');
console.log('🎉 种子数据初始化完成！');
console.log('   管理员账号: admin / admin123');
console.log('   演示账号:   demo  / demo123');
