/**
 * ハンド評価エンジン
 * - 7枚から最強の5枚を選択
 * - ハンドランク判定（ロイヤルフラッシュ〜ハイカード）
 * - 勝敗判定（キッカー含む）
 */

import { Card, Rank, Suit, HandRank, HandEvaluation, HAND_RANK_VALUES, HAND_RANK_NAMES, RANK_SYMBOLS } from '../../../shared/types.js';

/**
 * 7枚のカードから最強の5枚ハンドを評価
 */
export function evaluateHand(cards: Card[]): HandEvaluation {
  if (cards.length < 5 || cards.length > 7) {
    throw new Error(`Invalid number of cards: ${cards.length}. Expected 5-7.`);
  }

  // 5枚の全組み合わせを生成して最強を選ぶ
  const combinations = getCombinations(cards, 5);
  let bestEvaluation: HandEvaluation | null = null;

  for (const combo of combinations) {
    const evaluation = evaluate5Cards(combo);
    if (!bestEvaluation || compareHands(evaluation, bestEvaluation) > 0) {
      bestEvaluation = evaluation;
    }
  }

  return bestEvaluation!;
}

/**
 * 5枚のカードを評価
 */
function evaluate5Cards(cards: Card[]): HandEvaluation {
  const sorted = [...cards].sort((a, b) => b.rank - a.rank);
  const ranks = sorted.map(c => c.rank);
  const suits = sorted.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = checkStraight(ranks);
  const rankCounts = countRanks(ranks);
  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  // ハンドランク判定
  if (isFlush && isStraight) {
    if (ranks[0] === 14 && ranks[1] === 13) {
      return createEvaluation('royal-flush', sorted, 'ロイヤルフラッシュ');
    }
    return createEvaluation('straight-flush', sorted, `ストレートフラッシュ (${RANK_SYMBOLS[ranks[0]]}ハイ)`);
  }

  if (counts[0] === 4) {
    const quadRank = findRankByCount(rankCounts, 4);
    return createEvaluation('four-of-a-kind', sorted, `フォーカード (${RANK_SYMBOLS[quadRank]})`);
  }

  if (counts[0] === 3 && counts[1] === 2) {
    const tripRank = findRankByCount(rankCounts, 3);
    const pairRank = findRankByCount(rankCounts, 2);
    return createEvaluation('full-house', sorted, `フルハウス (${RANK_SYMBOLS[tripRank]} over ${RANK_SYMBOLS[pairRank]})`);
  }

  if (isFlush) {
    return createEvaluation('flush', sorted, `フラッシュ (${RANK_SYMBOLS[ranks[0]]}ハイ)`);
  }

  if (isStraight) {
    // A-2-3-4-5のストレート（ホイール）の場合、5がハイ
    const highCard = (ranks[0] === 14 && ranks[1] === 5) ? 5 : ranks[0];
    return createEvaluation('straight', sorted, `ストレート (${RANK_SYMBOLS[highCard]}ハイ)`);
  }

  if (counts[0] === 3) {
    const tripRank = findRankByCount(rankCounts, 3);
    return createEvaluation('three-of-a-kind', sorted, `スリーカード (${RANK_SYMBOLS[tripRank]})`);
  }

  if (counts[0] === 2 && counts[1] === 2) {
    const pairs = findAllRanksByCount(rankCounts, 2).sort((a, b) => b - a);
    return createEvaluation('two-pair', sorted, `ツーペア (${RANK_SYMBOLS[pairs[0]]} and ${RANK_SYMBOLS[pairs[1]]})`);
  }

  if (counts[0] === 2) {
    const pairRank = findRankByCount(rankCounts, 2);
    return createEvaluation('one-pair', sorted, `ワンペア (${RANK_SYMBOLS[pairRank]})`);
  }

  return createEvaluation('high-card', sorted, `ハイカード (${RANK_SYMBOLS[ranks[0]]})`);
}

/**
 * ストレートかどうか判定
 */
function checkStraight(ranks: Rank[]): boolean {
  const sorted = [...ranks].sort((a, b) => b - a);

  // 通常のストレート
  let isConsecutive = true;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i] - sorted[i + 1] !== 1) {
      isConsecutive = false;
      break;
    }
  }
  if (isConsecutive) return true;

  // A-2-3-4-5 (ホイール)
  const wheel = [14, 5, 4, 3, 2];
  if (sorted.length === 5 && wheel.every((r, i) => sorted[i] === r)) {
    return true;
  }

  return false;
}

/**
 * ランクごとの枚数をカウント
 */
function countRanks(ranks: Rank[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const rank of ranks) {
    counts[rank] = (counts[rank] || 0) + 1;
  }
  return counts;
}

/**
 * 指定枚数のランクを見つける
 */
function findRankByCount(counts: Record<number, number>, count: number): Rank {
  for (const [rank, c] of Object.entries(counts)) {
    if (c === count) return parseInt(rank) as Rank;
  }
  throw new Error(`No rank with count ${count}`);
}

/**
 * 指定枚数の全ランクを見つける
 */
function findAllRanksByCount(counts: Record<number, number>, count: number): Rank[] {
  const result: Rank[] = [];
  for (const [rank, c] of Object.entries(counts)) {
    if (c === count) result.push(parseInt(rank) as Rank);
  }
  return result;
}

/**
 * HandEvaluationを作成
 */
function createEvaluation(rank: HandRank, cards: Card[], description: string): HandEvaluation {
  const rankCounts = countRanks(cards.map(c => c.rank));

  // キッカー用のハイカードを計算（ペア等の構成要素の後に残りのカード）
  const highCards = cards
    .map(c => c.rank)
    .sort((a, b) => {
      // ペアやセット等の枚数が多い順、同じ枚数ならランク順
      const countA = rankCounts[a];
      const countB = rankCounts[b];
      if (countA !== countB) return countB - countA;
      return b - a;
    });

  return {
    rank,
    rankValue: HAND_RANK_VALUES[rank],
    highCards: highCards as Rank[],
    description,
    bestHand: cards,
  };
}

/**
 * 2つのハンドを比較
 * @returns 正: hand1が強い, 負: hand2が強い, 0: 同じ
 */
export function compareHands(hand1: HandEvaluation, hand2: HandEvaluation): number {
  // ハンドランクで比較
  if (hand1.rankValue !== hand2.rankValue) {
    return hand1.rankValue - hand2.rankValue;
  }

  // 同じハンドランクならハイカード（キッカー）で比較
  for (let i = 0; i < hand1.highCards.length; i++) {
    if (hand1.highCards[i] !== hand2.highCards[i]) {
      return hand1.highCards[i] - hand2.highCards[i];
    }
  }

  return 0; // 完全に同じ（チョップ）
}

/**
 * 配列からn個の組み合わせを生成
 */
function getCombinations<T>(arr: T[], n: number): T[][] {
  if (n === 0) return [[]];
  if (arr.length < n) return [];

  const result: T[][] = [];

  function combine(start: number, combo: T[]) {
    if (combo.length === n) {
      result.push([...combo]);
      return;
    }

    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }

  combine(0, []);
  return result;
}

/**
 * 複数プレイヤーの勝者を判定
 * @returns 勝者のインデックス配列（チョップの場合は複数）
 */
export function determineWinners(
  players: { holeCards: [Card, Card]; playerId: string }[],
  communityCards: Card[]
): { winnersIndices: number[]; evaluations: HandEvaluation[] } {
  const evaluations = players.map(p => {
    const allCards = [...p.holeCards, ...communityCards];
    return evaluateHand(allCards);
  });

  let bestIndices: number[] = [0];
  let bestEval = evaluations[0];

  for (let i = 1; i < evaluations.length; i++) {
    const comparison = compareHands(evaluations[i], bestEval);
    if (comparison > 0) {
      bestIndices = [i];
      bestEval = evaluations[i];
    } else if (comparison === 0) {
      bestIndices.push(i);
    }
  }

  return { winnersIndices: bestIndices, evaluations };
}
