/**
 * API ルート定義
 */

import { Router, Request, Response } from 'express';
import {
  createGameState,
  startNewHand,
  processAction,
  advanceToNextStreet,
  isBettingRoundComplete,
  isHandComplete,
  resolveShowdown,
  resolveByFold,
  moveToNextPlayer,
  getAvailableActions,
} from '../engine/index.js';
import { getAIAction, getThinkingDelay } from '../ai/index.js';
import { getGTORecommendation } from '../gto/index.js';
import { GameState, ActionType, DEFAULT_GAME_SETTINGS } from '../../../shared/types.js';

export const apiRouter = Router();

// ゲーム状態を保持（本番ではDBに保存）
let currentGame: GameState | null = null;

/**
 * 新しいゲームを開始
 */
apiRouter.post('/game/new', (req: Request, res: Response) => {
  const settings = { ...DEFAULT_GAME_SETTINGS, ...req.body };
  currentGame = createGameState(settings);
  currentGame = startNewHand(currentGame);

  res.json({
    success: true,
    game: sanitizeGameState(currentGame),
  });
});

/**
 * 現在のゲーム状態を取得
 */
apiRouter.get('/game/state', (req: Request, res: Response) => {
  if (!currentGame) {
    res.status(400).json({ error: 'No active game' });
    return;
  }

  res.json({
    game: sanitizeGameState(currentGame),
    currentPlayer: currentGame.players[currentGame.currentPlayerIndex],
    availableActions: getAvailableActions(currentGame, currentGame.players[currentGame.currentPlayerIndex]),
  });
});

/**
 * プレイヤーのアクションを処理
 */
apiRouter.post('/game/action', async (req: Request, res: Response) => {
  if (!currentGame) {
    res.status(400).json({ error: 'No active game' });
    return;
  }

  const { action, amount } = req.body as { action: ActionType; amount?: number };

  // アクション処理
  const result = processAction(currentGame, action, amount);

  if ('error' in result) {
    res.status(400).json({ error: result.error });
    return;
  }

  currentGame = result.state;

  // ゲーム進行を処理
  const progression = await processGameProgression();

  res.json({
    success: true,
    game: sanitizeGameState(currentGame),
    ...progression,
  });
});

/**
 * GTO推奨を取得
 */
apiRouter.get('/game/gto-recommendation', async (req: Request, res: Response) => {
  if (!currentGame) {
    res.status(400).json({ error: 'No active game' });
    return;
  }

  const heroPlayer = currentGame.players.find(p => p.isHero);
  if (!heroPlayer) {
    res.status(400).json({ error: 'No hero player found' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    return;
  }

  try {
    const recommendation = await getGTORecommendation(currentGame, heroPlayer, apiKey);
    res.json({ recommendation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get GTO recommendation' });
  }
});

/**
 * 新しいハンドを開始
 */
apiRouter.post('/game/new-hand', (req: Request, res: Response) => {
  if (!currentGame) {
    res.status(400).json({ error: 'No active game' });
    return;
  }

  currentGame = startNewHand(currentGame);

  res.json({
    success: true,
    game: sanitizeGameState(currentGame),
  });
});

/**
 * ゲーム進行を処理（AIアクション、ストリート進行など）
 */
async function processGameProgression(): Promise<{
  aiActions?: { playerId: string; action: ActionType; amount?: number; reasoning: string }[];
  handComplete?: boolean;
  winners?: { playerId: string; amount: number; handDescription?: string }[];
  streetAdvanced?: boolean;
}> {
  const result: {
    aiActions?: { playerId: string; action: ActionType; amount?: number; reasoning: string }[];
    handComplete?: boolean;
    winners?: { playerId: string; amount: number; handDescription?: string }[];
    streetAdvanced?: boolean;
  } = {};

  // ハンド終了チェック
  if (isHandComplete(currentGame!)) {
    const activePlayers = currentGame!.players.filter(p => !p.isFolded);

    if (activePlayers.length === 1) {
      // 全員フォールドで勝者決定
      const { state, winner } = resolveByFold(currentGame!);
      currentGame = state;
      result.handComplete = true;
      result.winners = [winner];
    } else {
      // ショーダウン
      const { state, winners } = resolveShowdown(currentGame!);
      currentGame = state;
      result.handComplete = true;
      result.winners = winners;
    }

    return result;
  }

  // ベッティングラウンド終了チェック
  if (isBettingRoundComplete(currentGame!)) {
    currentGame = advanceToNextStreet(currentGame!);
    result.streetAdvanced = true;

    // ショーダウンまで来たらハンド終了
    if (currentGame!.currentStreet === 'showdown' || isHandComplete(currentGame!)) {
      const { state, winners } = resolveShowdown(currentGame!);
      currentGame = state;
      result.handComplete = true;
      result.winners = winners;
      return result;
    }
  }

  // 次のプレイヤーに移動
  currentGame = moveToNextPlayer(currentGame!);

  // AIプレイヤーのアクションを処理
  const aiActions: { playerId: string; action: ActionType; amount?: number; reasoning: string }[] = [];

  while (currentGame && !currentGame.players[currentGame.currentPlayerIndex].isHero) {
    const currentPlayer = currentGame.players[currentGame.currentPlayerIndex];

    // フォールド済み、オールイン、非アクティブはスキップ
    if (currentPlayer.isFolded || currentPlayer.isAllIn || !currentPlayer.isActive) {
      currentGame = moveToNextPlayer(currentGame);

      // ベッティングラウンド終了チェック
      if (isBettingRoundComplete(currentGame)) {
        currentGame = advanceToNextStreet(currentGame);
        result.streetAdvanced = true;

        if (isHandComplete(currentGame)) {
          const { state, winners } = resolveShowdown(currentGame);
          currentGame = state;
          result.handComplete = true;
          result.winners = winners;
          break;
        }
      }

      continue;
    }

    // AIのアクションを取得
    const aiDecision = getAIAction(currentGame, currentPlayer);

    // アクションを処理
    const actionResult = processAction(currentGame, aiDecision.action, aiDecision.amount);

    if ('error' in actionResult) {
      // エラーの場合はチェックかフォールド
      const fallbackAction = currentPlayer.currentBet >= Math.max(...currentGame.players.map(p => p.currentBet))
        ? 'check' as ActionType
        : 'fold' as ActionType;
      const fallbackResult = processAction(currentGame, fallbackAction);
      if (!('error' in fallbackResult)) {
        currentGame = fallbackResult.state;
      }
    } else {
      currentGame = actionResult.state;
    }

    aiActions.push({
      playerId: currentPlayer.id,
      action: aiDecision.action,
      amount: aiDecision.amount,
      reasoning: aiDecision.reasoning,
    });

    // ハンド終了チェック
    if (isHandComplete(currentGame)) {
      const activePlayers = currentGame.players.filter(p => !p.isFolded);

      if (activePlayers.length === 1) {
        const { state, winner } = resolveByFold(currentGame);
        currentGame = state;
        result.handComplete = true;
        result.winners = [winner];
      } else {
        const { state, winners } = resolveShowdown(currentGame);
        currentGame = state;
        result.handComplete = true;
        result.winners = winners;
      }
      break;
    }

    // ベッティングラウンド終了チェック
    if (isBettingRoundComplete(currentGame)) {
      currentGame = advanceToNextStreet(currentGame);
      result.streetAdvanced = true;

      if (currentGame.currentStreet === 'showdown' || isHandComplete(currentGame)) {
        const { state, winners } = resolveShowdown(currentGame);
        currentGame = state;
        result.handComplete = true;
        result.winners = winners;
        break;
      }
    }

    // 次のプレイヤーに移動
    currentGame = moveToNextPlayer(currentGame);

    // ヒーローの番になったら終了
    if (currentGame.players[currentGame.currentPlayerIndex].isHero) {
      break;
    }
  }

  if (aiActions.length > 0) {
    result.aiActions = aiActions;
  }

  return result;
}

/**
 * ゲーム状態をクライアント向けにサニタイズ
 * （相手のホールカードを隠す）
 */
function sanitizeGameState(state: GameState): GameState {
  return {
    ...state,
    deck: [], // デッキは隠す
    players: state.players.map(p => ({
      ...p,
      // ショーダウン以外では相手のカードを隠す
      holeCards: p.isHero || state.currentStreet === 'showdown' ? p.holeCards : null,
    })),
  };
}
