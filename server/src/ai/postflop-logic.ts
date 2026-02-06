/**
 * ポストフロップ AIロジック
 * - ハンド強度の評価
 * - ドローの評価
 * - ベットサイジング
 */

import { Card, ActionType, Player, GameState, Rank } from '../../../shared/types.js';
import { evaluateHand, HandEvaluation } from '../engine/hand-evaluator.js';
import { getHighestBet, calculateCallAmount } from '../engine/pot-manager.js';

/**
 * ハンド強度を0-1のスコアで評価
 */
export function evaluateHandStrength(
  holeCards: [Card, Card],
  communityCards: Card[]
): number {
  if (communityCards.length === 0) {
    // プリフロップ: ホールカードの強さのみ
    return evaluatePreflopStrength(holeCards);
  }

  const allCards = [...holeCards, ...communityCards];
  const evaluation = evaluateHand(allCards);

  // ハンドランクに基づくベーススコア
  const rankScores: Record<string, number> = {
    'royal-flush': 1.0,
    'straight-flush': 0.98,
    'four-of-a-kind': 0.95,
    'full-house': 0.90,
    'flush': 0.80,
    'straight': 0.75,
    'three-of-a-kind': 0.65,
    'two-pair': 0.50,
    'one-pair': 0.35,
    'high-card': 0.15,
  };

  let score = rankScores[evaluation.rank] || 0.15;

  // ペアの場合、トップペア/セカンドペア/ボトムペアで調整
  if (evaluation.rank === 'one-pair') {
    score = adjustPairStrength(holeCards, communityCards, evaluation);
  }

  // キッカー強度で微調整
  const kickerBonus = (evaluation.highCards[0] - 2) / 12 * 0.05;
  score = Math.min(1, score + kickerBonus);

  return score;
}

/**
 * プリフロップのハンド強度
 */
function evaluatePreflopStrength(holeCards: [Card, Card]): number {
  const [c1, c2] = holeCards;
  const highRank = Math.max(c1.rank, c2.rank);
  const lowRank = Math.min(c1.rank, c2.rank);
  const isPair = c1.rank === c2.rank;
  const isSuited = c1.suit === c2.suit;
  const gap = highRank - lowRank;

  let score = 0;

  if (isPair) {
    // ペア: AA=1.0, KK=0.95, ..., 22=0.5
    score = 0.5 + (highRank - 2) / 12 * 0.5;
  } else {
    // ハイカード基準
    score = (highRank + lowRank - 4) / 24 * 0.6;

    // スーテッドボーナス
    if (isSuited) score += 0.05;

    // コネクターボーナス
    if (gap === 1) score += 0.03;
    else if (gap === 2) score += 0.01;
  }

  // Aを持っている場合のボーナス
  if (highRank === 14) score += 0.1;

  return Math.min(1, Math.max(0, score));
}

/**
 * ペアの強度を調整（トップペア、セカンドペア等）
 */
function adjustPairStrength(
  holeCards: [Card, Card],
  communityCards: Card[],
  evaluation: HandEvaluation
): number {
  const boardRanks = communityCards.map(c => c.rank).sort((a, b) => b - a);
  const holeRanks = holeCards.map(c => c.rank);

  // ポケットペアかどうか
  const isPocketPair = holeRanks[0] === holeRanks[1];

  if (isPocketPair) {
    const pairRank = holeRanks[0];
    // オーバーペア
    if (pairRank > boardRanks[0]) return 0.55;
    // セカンドペア相当
    if (pairRank > boardRanks[1]) return 0.45;
    // アンダーペア
    return 0.30;
  }

  // ボードとペアを作っている場合
  const pairRank = evaluation.highCards[0];
  if (pairRank === boardRanks[0]) {
    // トップペア
    const kicker = Math.max(...holeRanks.filter(r => r !== pairRank));
    if (kicker >= 12) return 0.50; // トップペア + 強キッカー
    if (kicker >= 9) return 0.45;  // トップペア + 中キッカー
    return 0.40; // トップペア + 弱キッカー
  } else if (pairRank === boardRanks[1]) {
    return 0.35; // セカンドペア
  } else {
    return 0.25; // ボトムペア
  }
}

/**
 * ドローのエクイティを評価
 */
export function evaluateDrawEquity(
  holeCards: [Card, Card],
  communityCards: Card[]
): { flushDraw: boolean; straightDraw: boolean; equity: number } {
  if (communityCards.length < 3) {
    return { flushDraw: false, straightDraw: false, equity: 0 };
  }

  const allCards = [...holeCards, ...communityCards];

  // フラッシュドロー判定
  const suitCounts: Record<string, number> = {};
  for (const card of allCards) {
    suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
  }
  const flushDraw = Object.values(suitCounts).some(count => count === 4);

  // ストレートドロー判定
  const ranks = [...new Set(allCards.map(c => c.rank))].sort((a, b) => a - b);
  let straightDraw = false;

  // 4枚連続があるか
  for (let i = 0; i <= ranks.length - 4; i++) {
    const consecutive = ranks.slice(i, i + 4);
    if (consecutive[3] - consecutive[0] <= 4) {
      straightDraw = true;
      break;
    }
  }

  // A-2-3-4 や J-Q-K-A のケース
  if (ranks.includes(14)) {
    const lowStraight = [2, 3, 4, 5].filter(r => ranks.includes(r as Rank)).length >= 3;
    const highStraight = [10, 11, 12, 13].filter(r => ranks.includes(r as Rank)).length >= 3;
    if (lowStraight || highStraight) straightDraw = true;
  }

  // エクイティ計算（簡易版）
  let equity = 0;
  if (flushDraw) equity += 0.35; // フラッシュドローは約35%
  if (straightDraw) equity += 0.17; // OESDは約17%、ガットショットは約8%

  // 両方ある場合は重複を考慮
  if (flushDraw && straightDraw) equity = Math.min(equity, 0.45);

  return { flushDraw, straightDraw, equity };
}

/**
 * SPR (Stack to Pot Ratio) を計算
 */
export function calculateSPR(effectiveStack: number, potSize: number): number {
  if (potSize === 0) return Infinity;
  return effectiveStack / potSize;
}

/**
 * ボードテクスチャを分析
 */
export function analyzeBoard(communityCards: Card[]): {
  isWet: boolean;
  isPaired: boolean;
  hasFlushDraw: boolean;
  hasStraightDraw: boolean;
  highCard: Rank;
} {
  if (communityCards.length === 0) {
    return {
      isWet: false,
      isPaired: false,
      hasFlushDraw: false,
      hasStraightDraw: false,
      highCard: 2 as Rank,
    };
  }

  const ranks = communityCards.map(c => c.rank);
  const suits = communityCards.map(c => c.suit);

  // ペアボード判定
  const rankCounts: Record<number, number> = {};
  for (const r of ranks) {
    rankCounts[r] = (rankCounts[r] || 0) + 1;
  }
  const isPaired = Object.values(rankCounts).some(c => c >= 2);

  // フラッシュドロー可能性
  const suitCounts: Record<string, number> = {};
  for (const s of suits) {
    suitCounts[s] = (suitCounts[s] || 0) + 1;
  }
  const hasFlushDraw = Object.values(suitCounts).some(c => c >= 2);

  // ストレートドロー可能性（コネクト度）
  const sortedRanks = [...ranks].sort((a, b) => a - b);
  let maxConnected = 1;
  let connected = 1;
  for (let i = 1; i < sortedRanks.length; i++) {
    if (sortedRanks[i] - sortedRanks[i - 1] <= 2) {
      connected++;
      maxConnected = Math.max(maxConnected, connected);
    } else {
      connected = 1;
    }
  }
  const hasStraightDraw = maxConnected >= 2;

  // ウェット/ドライ判定
  const isWet = hasFlushDraw || hasStraightDraw || !isPaired;

  const highCard = Math.max(...ranks) as Rank;

  return { isWet, isPaired, hasFlushDraw, hasStraightDraw, highCard };
}

/**
 * ポストフロップのアクションを決定
 */
export function getPostflopAction(
  state: GameState,
  player: Player
): { action: ActionType; amount?: number } {
  if (!player.holeCards) {
    return { action: 'fold' };
  }

  const handStrength = evaluateHandStrength(player.holeCards, state.communityCards);
  const drawInfo = evaluateDrawEquity(player.holeCards, state.communityCards);
  const boardInfo = analyzeBoard(state.communityCards);
  const highestBet = getHighestBet(state.players);
  const pot = state.pot;
  const effectiveStack = Math.min(player.stack, ...state.players.filter(p => p.isActive && !p.isFolded).map(p => p.stack));
  const spr = calculateSPR(effectiveStack, pot);
  const isIP = isInPosition(player, state);

  // ベットに直面している場合
  if (highestBet > player.currentBet) {
    const callAmount = calculateCallAmount(player, highestBet);
    const potOdds = callAmount / (pot + callAmount);

    // 強いハンドはコールorレイズ
    if (handStrength >= 0.7) {
      // バリューレイズ
      if (Math.random() < 0.6) {
        const raiseSize = Math.min(pot * 2.5, player.stack);
        return { action: 'raise', amount: highestBet + raiseSize };
      }
      return { action: 'call' };
    }

    // 中程度のハンドはポットオッズを考慮
    if (handStrength >= 0.4 || drawInfo.equity >= potOdds) {
      return { action: 'call' };
    }

    // ドローはセミブラフの可能性
    if (drawInfo.equity >= 0.25 && Math.random() < 0.3 && isIP) {
      const raiseSize = pot * 0.75;
      return { action: 'raise', amount: highestBet + raiseSize };
    }

    // 弱いハンドはフォールド
    return { action: 'fold' };
  }

  // チェックで回ってきた場合
  // 強いハンドはバリューベット
  if (handStrength >= 0.6) {
    const betSize = pot * (0.5 + Math.random() * 0.33); // 50-83%ポット
    return { action: 'bet', amount: Math.min(betSize, player.stack) };
  }

  // 中程度のハンド - ポジションに依存
  if (handStrength >= 0.35 && isIP) {
    // IPならベットすることも
    if (Math.random() < 0.4) {
      const betSize = pot * 0.5;
      return { action: 'bet', amount: Math.min(betSize, player.stack) };
    }
    return { action: 'check' };
  }

  // ドローでセミブラフ
  if (drawInfo.equity >= 0.25 && Math.random() < 0.35) {
    const betSize = pot * 0.6;
    return { action: 'bet', amount: Math.min(betSize, player.stack) };
  }

  // その他はチェック
  return { action: 'check' };
}

/**
 * プレイヤーがインポジションかどうか
 */
function isInPosition(player: Player, state: GameState): boolean {
  // アクティブなプレイヤーの中で最後にアクションするか
  const activePlayers = state.players.filter(p => p.isActive && !p.isFolded);
  const playerIdx = activePlayers.findIndex(p => p.id === player.id);

  // 簡易判定: BTNに近いほどIP
  const positionOrder = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  const playerPosIdx = positionOrder.indexOf(player.position);

  // ポストフロップではBTN > CO > HJ > UTG > BB > SB の順でIP
  return playerPosIdx >= 3 || player.position === 'BTN';
}

/**
 * ベットサイズを決定
 */
export function determineBetSize(
  pot: number,
  handStrength: number,
  spr: number,
  isBluff: boolean
): number {
  // SPRが低い場合はオールインに近いベット
  if (spr < 2) {
    return pot; // ポットサイズベット
  }

  if (isBluff) {
    // ブラフは小さめ（効率重視）
    return pot * 0.33 + pot * 0.17 * Math.random();
  }

  // バリューベットはハンド強度に応じて
  if (handStrength >= 0.8) {
    return pot * (0.75 + Math.random() * 0.25); // 75-100%
  } else if (handStrength >= 0.6) {
    return pot * (0.5 + Math.random() * 0.25); // 50-75%
  } else {
    return pot * (0.33 + Math.random() * 0.17); // 33-50%
  }
}
