/**
 * プリフロップレンジ
 * GTOベースのオープンレンジ、3bet/コールレンジ
 */

import { Position, ActionType } from '../../../shared/types.js';

// レンジ定義: "R100" = 100% Raise, "C50" = 50% Call, "F" = Fold
type RangeAction = string;

/**
 * RFI (Raise First In) レンジ
 * 誰もオープンしていない時のレイズレンジ
 */
export const RFI_RANGES: Record<Position, Record<string, RangeAction>> = {
  UTG: {
    // ポケットペア
    "AA": "R100", "KK": "R100", "QQ": "R100", "JJ": "R100", "TT": "R100",
    "99": "R100", "88": "R100", "77": "R80", "66": "R60", "55": "R40",
    "44": "R30", "33": "R20", "22": "R20",
    // Suited (AXs)
    "AKs": "R100", "AQs": "R100", "AJs": "R100", "ATs": "R100", "A9s": "R60",
    "A8s": "R40", "A7s": "R30", "A6s": "R30", "A5s": "R50", "A4s": "R40",
    "A3s": "R30", "A2s": "R20",
    // Suited (KXs)
    "KQs": "R100", "KJs": "R100", "KTs": "R90", "K9s": "R40",
    // Suited (QXs)
    "QJs": "R100", "QTs": "R80", "Q9s": "R30",
    // Suited (JXs)
    "JTs": "R100", "J9s": "R40",
    // Suited コネクター
    "T9s": "R70", "T8s": "R20", "98s": "R50", "87s": "R40", "76s": "R30", "65s": "R20", "54s": "R20",
    // Offsuit
    "AKo": "R100", "AQo": "R100", "AJo": "R90", "ATo": "R60",
    "KQo": "R90", "KJo": "R60", "KTo": "R30",
    "QJo": "R50", "QTo": "R20",
    "JTo": "R30",
  },
  HJ: {
    // ポケットペア
    "AA": "R100", "KK": "R100", "QQ": "R100", "JJ": "R100", "TT": "R100",
    "99": "R100", "88": "R100", "77": "R100", "66": "R80", "55": "R60",
    "44": "R50", "33": "R40", "22": "R40",
    // Suited
    "AKs": "R100", "AQs": "R100", "AJs": "R100", "ATs": "R100", "A9s": "R80",
    "A8s": "R60", "A7s": "R50", "A6s": "R50", "A5s": "R80", "A4s": "R60",
    "A3s": "R50", "A2s": "R40",
    "KQs": "R100", "KJs": "R100", "KTs": "R100", "K9s": "R60", "K8s": "R30",
    "QJs": "R100", "QTs": "R100", "Q9s": "R50", "Q8s": "R20",
    "JTs": "R100", "J9s": "R60", "J8s": "R30",
    "T9s": "R100", "T8s": "R50", "98s": "R80", "97s": "R30",
    "87s": "R70", "86s": "R20", "76s": "R50", "75s": "R20", "65s": "R40", "54s": "R30", "43s": "R20",
    // Offsuit
    "AKo": "R100", "AQo": "R100", "AJo": "R100", "ATo": "R80", "A9o": "R40",
    "KQo": "R100", "KJo": "R80", "KTo": "R50", "K9o": "R20",
    "QJo": "R80", "QTo": "R50", "Q9o": "R20",
    "JTo": "R60", "J9o": "R20",
    "T9o": "R30",
  },
  CO: {
    // ポケットペア - ほぼ全てオープン
    "AA": "R100", "KK": "R100", "QQ": "R100", "JJ": "R100", "TT": "R100",
    "99": "R100", "88": "R100", "77": "R100", "66": "R100", "55": "R100",
    "44": "R80", "33": "R70", "22": "R70",
    // Suited - 広いレンジ
    "AKs": "R100", "AQs": "R100", "AJs": "R100", "ATs": "R100", "A9s": "R100",
    "A8s": "R100", "A7s": "R100", "A6s": "R100", "A5s": "R100", "A4s": "R100",
    "A3s": "R100", "A2s": "R100",
    "KQs": "R100", "KJs": "R100", "KTs": "R100", "K9s": "R100", "K8s": "R70",
    "K7s": "R50", "K6s": "R40", "K5s": "R40", "K4s": "R30", "K3s": "R20", "K2s": "R20",
    "QJs": "R100", "QTs": "R100", "Q9s": "R100", "Q8s": "R60", "Q7s": "R30",
    "Q6s": "R30", "Q5s": "R30", "Q4s": "R20",
    "JTs": "R100", "J9s": "R100", "J8s": "R70", "J7s": "R40", "J6s": "R30",
    "T9s": "R100", "T8s": "R100", "T7s": "R50", "T6s": "R30",
    "98s": "R100", "97s": "R80", "96s": "R40", "95s": "R20",
    "87s": "R100", "86s": "R60", "85s": "R30",
    "76s": "R100", "75s": "R50", "74s": "R20",
    "65s": "R100", "64s": "R40", "63s": "R20",
    "54s": "R100", "53s": "R40", "52s": "R20",
    "43s": "R50", "42s": "R20", "32s": "R30",
    // Offsuit
    "AKo": "R100", "AQo": "R100", "AJo": "R100", "ATo": "R100", "A9o": "R100",
    "A8o": "R80", "A7o": "R60", "A6o": "R50", "A5o": "R70", "A4o": "R50", "A3o": "R40", "A2o": "R30",
    "KQo": "R100", "KJo": "R100", "KTo": "R100", "K9o": "R70", "K8o": "R30",
    "K7o": "R20", "K6o": "R20",
    "QJo": "R100", "QTo": "R100", "Q9o": "R60", "Q8o": "R20",
    "JTo": "R100", "J9o": "R60", "J8o": "R20",
    "T9o": "R80", "T8o": "R30",
    "98o": "R60", "97o": "R20",
    "87o": "R40", "76o": "R30", "65o": "R20", "54o": "R20",
  },
  BTN: {
    // ポケットペア - 全てオープン
    "AA": "R100", "KK": "R100", "QQ": "R100", "JJ": "R100", "TT": "R100",
    "99": "R100", "88": "R100", "77": "R100", "66": "R100", "55": "R100",
    "44": "R100", "33": "R100", "22": "R100",
    // Suited - 非常に広いレンジ
    "AKs": "R100", "AQs": "R100", "AJs": "R100", "ATs": "R100", "A9s": "R100",
    "A8s": "R100", "A7s": "R100", "A6s": "R100", "A5s": "R100", "A4s": "R100",
    "A3s": "R100", "A2s": "R100",
    "KQs": "R100", "KJs": "R100", "KTs": "R100", "K9s": "R100", "K8s": "R100",
    "K7s": "R100", "K6s": "R100", "K5s": "R100", "K4s": "R100", "K3s": "R100", "K2s": "R100",
    "QJs": "R100", "QTs": "R100", "Q9s": "R100", "Q8s": "R100", "Q7s": "R80",
    "Q6s": "R80", "Q5s": "R80", "Q4s": "R70", "Q3s": "R60", "Q2s": "R60",
    "JTs": "R100", "J9s": "R100", "J8s": "R100", "J7s": "R80", "J6s": "R70",
    "J5s": "R60", "J4s": "R50", "J3s": "R40", "J2s": "R40",
    "T9s": "R100", "T8s": "R100", "T7s": "R100", "T6s": "R70", "T5s": "R50",
    "T4s": "R40", "T3s": "R30", "T2s": "R30",
    "98s": "R100", "97s": "R100", "96s": "R80", "95s": "R60", "94s": "R40",
    "93s": "R30", "92s": "R30",
    "87s": "R100", "86s": "R100", "85s": "R70", "84s": "R50", "83s": "R30", "82s": "R30",
    "76s": "R100", "75s": "R100", "74s": "R60", "73s": "R40", "72s": "R30",
    "65s": "R100", "64s": "R100", "63s": "R50", "62s": "R40",
    "54s": "R100", "53s": "R80", "52s": "R50",
    "43s": "R100", "42s": "R50", "32s": "R80",
    // Offsuit - 広いレンジ
    "AKo": "R100", "AQo": "R100", "AJo": "R100", "ATo": "R100", "A9o": "R100",
    "A8o": "R100", "A7o": "R100", "A6o": "R100", "A5o": "R100", "A4o": "R100",
    "A3o": "R100", "A2o": "R100",
    "KQo": "R100", "KJo": "R100", "KTo": "R100", "K9o": "R100", "K8o": "R80",
    "K7o": "R70", "K6o": "R60", "K5o": "R50", "K4o": "R40", "K3o": "R40", "K2o": "R30",
    "QJo": "R100", "QTo": "R100", "Q9o": "R100", "Q8o": "R70", "Q7o": "R40",
    "Q6o": "R30", "Q5o": "R30", "Q4o": "R20", "Q3o": "R20", "Q2o": "R20",
    "JTo": "R100", "J9o": "R100", "J8o": "R70", "J7o": "R40", "J6o": "R20",
    "J5o": "R20",
    "T9o": "R100", "T8o": "R80", "T7o": "R40", "T6o": "R20",
    "98o": "R100", "97o": "R60", "96o": "R30",
    "87o": "R100", "86o": "R50", "85o": "R20",
    "76o": "R80", "75o": "R40",
    "65o": "R70", "64o": "R30",
    "54o": "R60", "53o": "R20",
    "43o": "R30", "32o": "R20",
  },
  SB: {
    // SBは3bet or foldが基本（vs リンプなし）
    // ここではRFI（BBに対するオープン）を定義
    "AA": "R100", "KK": "R100", "QQ": "R100", "JJ": "R100", "TT": "R100",
    "99": "R100", "88": "R100", "77": "R100", "66": "R100", "55": "R100",
    "44": "R100", "33": "R100", "22": "R100",
    // 全suited
    "AKs": "R100", "AQs": "R100", "AJs": "R100", "ATs": "R100", "A9s": "R100",
    "A8s": "R100", "A7s": "R100", "A6s": "R100", "A5s": "R100", "A4s": "R100",
    "A3s": "R100", "A2s": "R100",
    "KQs": "R100", "KJs": "R100", "KTs": "R100", "K9s": "R100", "K8s": "R100",
    "K7s": "R100", "K6s": "R100", "K5s": "R100", "K4s": "R100", "K3s": "R100", "K2s": "R100",
    "QJs": "R100", "QTs": "R100", "Q9s": "R100", "Q8s": "R100", "Q7s": "R100",
    "Q6s": "R100", "Q5s": "R100", "Q4s": "R100", "Q3s": "R100", "Q2s": "R100",
    "JTs": "R100", "J9s": "R100", "J8s": "R100", "J7s": "R100", "J6s": "R100",
    "J5s": "R100", "J4s": "R100", "J3s": "R100", "J2s": "R100",
    "T9s": "R100", "T8s": "R100", "T7s": "R100", "T6s": "R100", "T5s": "R100",
    "T4s": "R100", "T3s": "R100", "T2s": "R100",
    "98s": "R100", "97s": "R100", "96s": "R100", "95s": "R100", "94s": "R100",
    "93s": "R100", "92s": "R100",
    "87s": "R100", "86s": "R100", "85s": "R100", "84s": "R100", "83s": "R100", "82s": "R100",
    "76s": "R100", "75s": "R100", "74s": "R100", "73s": "R100", "72s": "R100",
    "65s": "R100", "64s": "R100", "63s": "R100", "62s": "R100",
    "54s": "R100", "53s": "R100", "52s": "R100",
    "43s": "R100", "42s": "R100", "32s": "R100",
    // Offsuit - ほぼ全て
    "AKo": "R100", "AQo": "R100", "AJo": "R100", "ATo": "R100", "A9o": "R100",
    "A8o": "R100", "A7o": "R100", "A6o": "R100", "A5o": "R100", "A4o": "R100",
    "A3o": "R100", "A2o": "R100",
    "KQo": "R100", "KJo": "R100", "KTo": "R100", "K9o": "R100", "K8o": "R100",
    "K7o": "R100", "K6o": "R100", "K5o": "R100", "K4o": "R100", "K3o": "R100", "K2o": "R100",
    "QJo": "R100", "QTo": "R100", "Q9o": "R100", "Q8o": "R100", "Q7o": "R100",
    "Q6o": "R100", "Q5o": "R100", "Q4o": "R100", "Q3o": "R100", "Q2o": "R100",
    "JTo": "R100", "J9o": "R100", "J8o": "R100", "J7o": "R100", "J6o": "R100",
    "J5o": "R100", "J4o": "R100", "J3o": "R100", "J2o": "R100",
    "T9o": "R100", "T8o": "R100", "T7o": "R100", "T6o": "R100", "T5o": "R100",
    "T4o": "R100", "T3o": "R100", "T2o": "R100",
    "98o": "R100", "97o": "R100", "96o": "R100", "95o": "R100", "94o": "R100",
    "93o": "R100", "92o": "R100",
    "87o": "R100", "86o": "R100", "85o": "R100", "84o": "R100", "83o": "R100", "82o": "R100",
    "76o": "R100", "75o": "R100", "74o": "R100", "73o": "R100", "72o": "R100",
    "65o": "R100", "64o": "R100", "63o": "R100", "62o": "R100",
    "54o": "R100", "53o": "R100", "52o": "R100",
    "43o": "R100", "42o": "R100", "32o": "R100",
  },
  BB: {
    // BBはディフェンス（コール）が主
    // RFI時はSBと同様（vs リンプ等）
    "AA": "R100", "KK": "R100", "QQ": "R100", "JJ": "R100", "TT": "R100",
    "99": "R100", "88": "R100", "77": "R100", "66": "R100", "55": "R100",
    "44": "R100", "33": "R100", "22": "R100",
    "AKs": "R100", "AQs": "R100", "AJs": "R100", "ATs": "R100", "A9s": "R100",
    "A8s": "R100", "A7s": "R100", "A6s": "R100", "A5s": "R100", "A4s": "R100",
    "A3s": "R100", "A2s": "R100",
    "KQs": "R100", "KJs": "R100", "KTs": "R100", "K9s": "R100", "K8s": "R100",
    "K7s": "R100", "K6s": "R100", "K5s": "R100", "K4s": "R100", "K3s": "R100", "K2s": "R100",
    "QJs": "R100", "QTs": "R100", "Q9s": "R100", "Q8s": "R100", "Q7s": "R100",
    "Q6s": "R100", "Q5s": "R100", "Q4s": "R100", "Q3s": "R100", "Q2s": "R100",
    "JTs": "R100", "J9s": "R100", "J8s": "R100", "J7s": "R100", "J6s": "R100",
    "J5s": "R100", "J4s": "R100", "J3s": "R100", "J2s": "R100",
    "T9s": "R100", "T8s": "R100", "T7s": "R100", "T6s": "R100", "T5s": "R100",
    "T4s": "R100", "T3s": "R100", "T2s": "R100",
    "98s": "R100", "97s": "R100", "96s": "R100", "95s": "R100", "94s": "R100",
    "93s": "R100", "92s": "R100",
    "87s": "R100", "86s": "R100", "85s": "R100", "84s": "R100", "83s": "R100", "82s": "R100",
    "76s": "R100", "75s": "R100", "74s": "R100", "73s": "R100", "72s": "R100",
    "65s": "R100", "64s": "R100", "63s": "R100", "62s": "R100",
    "54s": "R100", "53s": "R100", "52s": "R100",
    "43s": "R100", "42s": "R100", "32s": "R100",
    "AKo": "R100", "AQo": "R100", "AJo": "R100", "ATo": "R100", "A9o": "R100",
    "A8o": "R100", "A7o": "R100", "A6o": "R100", "A5o": "R100", "A4o": "R100",
    "A3o": "R100", "A2o": "R100",
    "KQo": "R100", "KJo": "R100", "KTo": "R100", "K9o": "R100", "K8o": "R100",
    "K7o": "R100", "K6o": "R100", "K5o": "R100", "K4o": "R100", "K3o": "R100", "K2o": "R100",
    "QJo": "R100", "QTo": "R100", "Q9o": "R100", "Q8o": "R100", "Q7o": "R100",
    "Q6o": "R100", "Q5o": "R100", "Q4o": "R100", "Q3o": "R100", "Q2o": "R100",
    "JTo": "R100", "J9o": "R100", "J8o": "R100", "J7o": "R100", "J6o": "R100",
    "J5o": "R100", "J4o": "R100", "J3o": "R100", "J2o": "R100",
    "T9o": "R100", "T8o": "R100", "T7o": "R100", "T6o": "R100", "T5o": "R100",
    "T4o": "R100", "T3o": "R100", "T2o": "R100",
    "98o": "R100", "97o": "R100", "96o": "R100", "95o": "R100", "94o": "R100",
    "93o": "R100", "92o": "R100",
    "87o": "R100", "86o": "R100", "85o": "R100", "84o": "R100", "83o": "R100", "82o": "R100",
    "76o": "R100", "75o": "R100", "74o": "R100", "73o": "R100", "72o": "R100",
    "65o": "R100", "64o": "R100", "63o": "R100", "62o": "R100",
    "54o": "R100", "53o": "R100", "52o": "R100",
    "43o": "R100", "42o": "R100", "32o": "R100",
  },
};

/**
 * レンジアクションをパース
 */
export function parseRangeAction(action: string): { type: 'raise' | 'call' | 'fold'; frequency: number } {
  if (!action || action === 'F') {
    return { type: 'fold', frequency: 100 };
  }
  if (action.startsWith('R')) {
    const freq = parseInt(action.slice(1)) || 100;
    return { type: 'raise', frequency: freq };
  }
  if (action.startsWith('C')) {
    const freq = parseInt(action.slice(1)) || 100;
    return { type: 'call', frequency: freq };
  }
  return { type: 'fold', frequency: 100 };
}

/**
 * ハンド表記を正規化（AKs, AKo, AA形式）
 */
export function normalizeHandNotation(card1Rank: string, card2Rank: string, suited: boolean): string {
  const rankOrder = '23456789TJQKA';
  const r1 = rankOrder.indexOf(card1Rank);
  const r2 = rankOrder.indexOf(card2Rank);

  const [high, low] = r1 >= r2 ? [card1Rank, card2Rank] : [card2Rank, card1Rank];

  if (high === low) {
    return `${high}${low}`;
  }
  return `${high}${low}${suited ? 's' : 'o'}`;
}

/**
 * プリフロップアクションを決定（混合戦略対応）
 */
export function getPreflopAction(
  position: Position,
  handNotation: string,
  isRFI: boolean
): { action: ActionType; shouldAct: boolean } {
  if (!isRFI) {
    // vs RFIの場合は別途実装が必要
    // 簡易的にフォールド
    return { action: 'fold', shouldAct: true };
  }

  const range = RFI_RANGES[position];
  const rangeAction = range?.[handNotation];

  if (!rangeAction || rangeAction === 'F') {
    return { action: 'fold', shouldAct: true };
  }

  const parsed = parseRangeAction(rangeAction);

  if (parsed.type === 'fold') {
    return { action: 'fold', shouldAct: true };
  }

  // 混合戦略: 確率でアクションを決定
  const random = Math.random() * 100;
  if (random < parsed.frequency) {
    return { action: parsed.type === 'raise' ? 'raise' : 'call', shouldAct: true };
  } else {
    return { action: 'fold', shouldAct: true };
  }
}

/**
 * オープンレート（%）を計算
 */
export function calculateOpenRate(position: Position): number {
  const range = RFI_RANGES[position];
  if (!range) return 0;

  let totalCombos = 0;
  let openCombos = 0;

  for (const [hand, action] of Object.entries(range)) {
    // コンボ数を計算
    let combos: number;
    if (hand.length === 2) {
      combos = 6; // ペア
    } else if (hand.endsWith('s')) {
      combos = 4; // スーテッド
    } else {
      combos = 12; // オフスート
    }

    totalCombos += combos;

    const parsed = parseRangeAction(action);
    if (parsed.type === 'raise') {
      openCombos += combos * (parsed.frequency / 100);
    }
  }

  return (openCombos / 1326) * 100; // 全コンボは1326
}
