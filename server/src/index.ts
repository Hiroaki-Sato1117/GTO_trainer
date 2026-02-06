/**
 * GTO Poker Trainer - サーバーエントリーポイント
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './api/routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors());
app.use(express.json());

// API ルート
app.use('/api', apiRouter);

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🃏 GTO Poker Trainer Server running on http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api`);
});
