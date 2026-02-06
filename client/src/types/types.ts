/**
 * GTO Poker Trainer - 共有型定義
 */

// ============================
// カード関連
// ============================

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  rank: Rank;
  suit: Suit;
}

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const RANK_SYMBOLS: Record<Rank, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: 'T',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

// ============================
// ポジション
// ============================

export type Position = 'BTN' | 'SB' | 'BB' | 'UTG' | 'HJ' | 'CO';

export const POSITIONS_6MAX: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

// ============================
// アクション
// ============================

export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';

export interface Action {
  type: ActionType;
  amount?: number;
  playerId: string;
  position: Position;
  street: Street;
  timestamp: number;
}

// ============================
// ストリート
// ============================

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

// ============================
// プレイヤー
// ============================

export interface Player {
  id: string;
  name: string;
  position: Position;
  stack: number;
  holeCards: [Card, Card] | null;
  isHero: boolean;
  isActive: boolean;       // まだハンドに参加しているか
  isFolded: boolean;       // フォールドしたか
  isAllIn: boolean;        // オールインしたか
  currentBet: number;      // 今のストリートでのベット額
  totalBetThisHand: number;
  hasActed: boolean;       // 今のストリートでアクション済みか
}

// ============================
// ポット
// ============================

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

// ============================
// ゲーム状態
// ============================

export interface GameState {
  id: string;
  players: Player[];
  deck: Card[];
  communityCards: Card[];
  pot: number;
  sidePots: SidePot[];
  currentStreet: Street;
  currentPlayerIndex: number;
  dealerIndex: number;
  blinds: { sb: number; bb: number };
  ante: number;
  actionHistory: Action[];
  handNumber: number;
  isHandComplete: boolean;
  lastRaiseAmount: number;  // 最後のレイズ額（ミニマムレイズ計算用）
  lastAggressorIndex: number | null;  // 最後にベット/レイズしたプレイヤー
}

// ============================
// ハンド評価
// ============================

export type HandRank =
  | 'royal-flush'
  | 'straight-flush'
  | 'four-of-a-kind'
  | 'full-house'
  | 'flush'
  | 'straight'
  | 'three-of-a-kind'
  | 'two-pair'
  | 'one-pair'
  | 'high-card';

export const HAND_RANK_VALUES: Record<HandRank, number> = {
  'royal-flush': 10,
  'straight-flush': 9,
  'four-of-a-kind': 8,
  'full-house': 7,
  'flush': 6,
  'straight': 5,
  'three-of-a-kind': 4,
  'two-pair': 3,
  'one-pair': 2,
  'high-card': 1,
};

export const HAND_RANK_NAMES: Record<HandRank, string> = {
  'royal-flush': 'ロイヤルフラッシュ',
  'straight-flush': 'ストレートフラッシュ',
  'four-of-a-kind': 'フォーカード',
  'full-house': 'フルハウス',
  'flush': 'フラッシュ',
  'straight': 'ストレート',
  'three-of-a-kind': 'スリーカード',
  'two-pair': 'ツーペア',
  'one-pair': 'ワンペア',
  'high-card': 'ハイカード',
};

export interface HandEvaluation {
  rank: HandRank;
  rankValue: number;
  highCards: Rank[];  // キッカー判定用（降順）
  description: string;
  bestHand: Card[];   // 最強の5枚
}

// ============================
// GTO推奨
// ============================

export interface GTOAction {
  action: ActionType;
  size?: number;
  sizeDescription?: string;
  frequency: number;  // 0-1
}

export interface GTORecommendation {
  primaryAction: GTOAction;
  mixedStrategy: GTOAction[];
  reasoning: {
    summary: string;
    details: string[];
  };
  evEstimate?: Record<string, number>;
}

// ============================
// ゲーム設定
// ============================

export interface GameSettings {
  initialStack: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  playerCount: number;
  heroPosition: Position;
  showGTOHints: boolean;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  initialStack: 10000,  // 100BB
  smallBlind: 50,
  bigBlind: 100,
  ante: 0,
  playerCount: 6,
  heroPosition: 'BTN',
  showGTOHints: true,
};
