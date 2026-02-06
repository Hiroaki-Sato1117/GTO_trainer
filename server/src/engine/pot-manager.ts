/**
 * ポット管理
 * - メインポット計算
 * - サイドポット計算（複数オールイン対応）
 * - ポット分配
 */

import { Player, SidePot, Card } from '../../../shared/types.js';
import { determineWinners } from './hand-evaluator.js';

/**
 * 全プレイヤーのベットからポットを計算
 */
export function calculatePot(players: Player[]): number {
  return players.reduce((sum, p) => sum + p.totalBetThisHand, 0);
}

/**
 * サイドポットを計算
 * オールインしたプレイヤーがいる場合に必要
 */
export function calculateSidePots(players: Player[]): SidePot[] {
  // アクティブ（フォールドしていない）プレイヤーのみ対象
  const activePlayers = players.filter(p => !p.isFolded);

  if (activePlayers.length === 0) {
    return [];
  }

  // ベット額でソート（昇順）
  const sortedByBet = [...activePlayers].sort((a, b) => a.totalBetThisHand - b.totalBetThisHand);

  const pots: SidePot[] = [];
  let previousBet = 0;

  for (let i = 0; i < sortedByBet.length; i++) {
    const currentBet = sortedByBet[i].totalBetThisHand;

    if (currentBet > previousBet) {
      const betDiff = currentBet - previousBet;
      const eligibleCount = sortedByBet.length - i;
      const potAmount = betDiff * eligibleCount;

      // このポットに参加できるプレイヤー
      const eligiblePlayerIds = sortedByBet.slice(i).map(p => p.id);

      pots.push({
        amount: potAmount,
        eligiblePlayerIds,
      });

      previousBet = currentBet;
    }
  }

  // フォールドしたプレイヤーのベットも加算
  const foldedBets = players
    .filter(p => p.isFolded)
    .reduce((sum, p) => sum + p.totalBetThisHand, 0);

  if (foldedBets > 0 && pots.length > 0) {
    // フォールドしたプレイヤーのベットはメインポットに加算
    pots[0].amount += foldedBets;
  } else if (foldedBets > 0) {
    // アクティブプレイヤーが1人の場合
    pots.push({
      amount: foldedBets,
      eligiblePlayerIds: activePlayers.map(p => p.id),
    });
  }

  return pots;
}

/**
 * ポットを勝者に分配
 */
export function distributePots(
  players: Player[],
  communityCards: Card[],
  sidePots: SidePot[]
): { playerId: string; amount: number; handDescription: string }[] {
  const winnings: Map<string, { amount: number; handDescription: string }> = new Map();

  for (const pot of sidePots) {
    // このポットに参加できるプレイヤーのみで勝敗判定
    const eligiblePlayers = players.filter(
      p => pot.eligiblePlayerIds.includes(p.id) && !p.isFolded && p.holeCards
    );

    if (eligiblePlayers.length === 0) {
      continue;
    }

    if (eligiblePlayers.length === 1) {
      // 1人だけならそのプレイヤーが獲得
      const winner = eligiblePlayers[0];
      const current = winnings.get(winner.id) || { amount: 0, handDescription: '' };
      current.amount += pot.amount;
      winnings.set(winner.id, current);
      continue;
    }

    // 勝者を判定
    const { winnersIndices, evaluations } = determineWinners(
      eligiblePlayers.map(p => ({
        holeCards: p.holeCards as [Card, Card],
        playerId: p.id,
      })),
      communityCards
    );

    // ポットを勝者で分割
    const share = Math.floor(pot.amount / winnersIndices.length);
    const remainder = pot.amount % winnersIndices.length;

    winnersIndices.forEach((winnerIdx, i) => {
      const winner = eligiblePlayers[winnerIdx];
      const current = winnings.get(winner.id) || { amount: 0, handDescription: '' };
      // 余りは最初の勝者に
      current.amount += share + (i === 0 ? remainder : 0);
      current.handDescription = evaluations[winnerIdx].description;
      winnings.set(winner.id, current);
    });
  }

  return Array.from(winnings.entries()).map(([playerId, data]) => ({
    playerId,
    ...data,
  }));
}

/**
 * 現在のストリートのベットを計算
 */
export function calculateCurrentStreetPot(players: Player[]): number {
  return players.reduce((sum, p) => sum + p.currentBet, 0);
}

/**
 * コールに必要な額を計算
 */
export function calculateCallAmount(player: Player, highestBet: number): number {
  const needed = highestBet - player.currentBet;
  // スタックより多い場合はオールイン
  return Math.min(needed, player.stack);
}

/**
 * 最小レイズ額を計算
 */
export function calculateMinRaise(
  currentBet: number,
  lastRaiseAmount: number,
  bigBlind: number
): number {
  // 最小レイズは前のレイズ額以上、最低でも1BB
  return currentBet + Math.max(lastRaiseAmount, bigBlind);
}

/**
 * 現在の最高ベット額を取得
 */
export function getHighestBet(players: Player[]): number {
  return Math.max(...players.map(p => p.currentBet), 0);
}
