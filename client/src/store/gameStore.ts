/**
 * ゲーム状態管理（Zustand）
 */

import { create } from 'zustand';
import type { GameState, Player, GTORecommendation, ActionType } from '../types/types';

const API_BASE = 'http://localhost:3001/api';

// 利用可能なアクションを計算
function getAvailableActions(game: GameState, player: Player | null) {
  if (!player || player.isFolded || !player.isActive) {
    return [];
  }

  const actions: { action: ActionType; minAmount?: number; maxAmount?: number }[] = [];
  const currentBet = game.players.reduce((max, p) => Math.max(max, p.currentBet), 0);
  const toCall = currentBet - player.currentBet;

  // フォールドは常に可能
  actions.push({ action: 'fold' });

  if (toCall === 0) {
    // チェック可能
    actions.push({ action: 'check' });
    // ベット可能
    if (player.stack > 0) {
      actions.push({
        action: 'bet',
        minAmount: game.blinds.bb,
        maxAmount: player.stack,
      });
    }
  } else {
    // コール可能
    if (player.stack >= toCall) {
      actions.push({ action: 'call', minAmount: toCall });
    }
    // レイズ可能
    const minRaise = Math.max(game.lastRaiseAmount || game.blinds.bb, game.blinds.bb);
    if (player.stack > toCall) {
      actions.push({
        action: 'raise',
        minAmount: currentBet + minRaise,
        maxAmount: player.stack + player.currentBet,
      });
    }
  }

  // オールイン
  if (player.stack > 0) {
    actions.push({ action: 'all-in', minAmount: player.stack });
  }

  return actions;
}

interface GameStore {
  // 状態
  game: GameState | null;
  currentPlayer: Player | null;
  availableActions: { action: ActionType; minAmount?: number; maxAmount?: number }[];
  gtoRecommendation: GTORecommendation | null;
  aiActions: { playerId: string; action: ActionType; amount?: number; reasoning: string }[];
  winners: { playerId: string; amount: number; handDescription?: string }[] | null;
  isLoading: boolean;
  error: string | null;
  showGTOHints: boolean;

  // アクション
  startNewGame: () => Promise<void>;
  startNewHand: () => Promise<void>;
  performAction: (action: ActionType, amount?: number) => Promise<void>;
  fetchGTORecommendation: () => Promise<void>;
  toggleGTOHints: () => void;
  clearWinners: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // 初期状態
  game: null,
  currentPlayer: null,
  availableActions: [],
  gtoRecommendation: null,
  aiActions: [],
  winners: null,
  isLoading: false,
  error: null,
  showGTOHints: true,

  // 新しいゲームを開始
  startNewGame: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/game/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to start new game');
      }

      const data = await response.json();
      const currentPlayer = data.game.players[data.game.currentPlayerIndex];
      set({
        game: data.game,
        currentPlayer,
        availableActions: getAvailableActions(data.game, currentPlayer),
        isLoading: false,
      });

      // ヒーローの番でGTOヒントがONなら推奨を取得（非同期で）
      if (currentPlayer?.isHero && get().showGTOHints) {
        get().fetchGTORecommendation();
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 新しいハンドを開始
  startNewHand: async () => {
    set({ isLoading: true, error: null, winners: null, gtoRecommendation: null });
    try {
      const response = await fetch(`${API_BASE}/game/new-hand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to start new hand');
      }

      const data = await response.json();
      const currentPlayer = data.game.players[data.game.currentPlayerIndex];
      set({
        game: data.game,
        currentPlayer,
        availableActions: getAvailableActions(data.game, currentPlayer),
        aiActions: [],
        isLoading: false,
      });

      // ヒーローの番でGTOヒントがONなら推奨を取得
      if (currentPlayer?.isHero && get().showGTOHints) {
        get().fetchGTORecommendation();
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // アクションを実行
  performAction: async (action: ActionType, amount?: number) => {
    set({ isLoading: true, error: null, gtoRecommendation: null });
    try {
      const response = await fetch(`${API_BASE}/game/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to perform action');
      }

      const data = await response.json();

      set({
        game: data.game,
        aiActions: data.aiActions || [],
        isLoading: false,
      });

      // ハンド終了チェック
      if (data.handComplete) {
        set({ winners: data.winners });
      } else {
        // 現在のプレイヤーを更新
        const currentPlayer = data.game.players[data.game.currentPlayerIndex];
        set({
          currentPlayer,
          availableActions: getAvailableActions(data.game, currentPlayer),
        });

        // ヒーローの番でGTOヒントがONなら推奨を取得
        if (currentPlayer?.isHero && get().showGTOHints) {
          get().fetchGTORecommendation();
        }
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // GTO推奨を取得
  fetchGTORecommendation: async () => {
    try {
      const response = await fetch(`${API_BASE}/game/gto-recommendation`);

      if (!response.ok) {
        throw new Error('Failed to fetch GTO recommendation');
      }

      const data = await response.json();
      set({ gtoRecommendation: data.recommendation });
    } catch (error) {
      console.error('Failed to fetch GTO recommendation:', error);
    }
  },

  // GTOヒントの表示切替
  toggleGTOHints: () => {
    set((state) => ({ showGTOHints: !state.showGTOHints }));
  },

  // 勝者表示をクリア
  clearWinners: () => {
    set({ winners: null });
  },
}));
