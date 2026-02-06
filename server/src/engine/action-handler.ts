/**
 * アクション処理
 * - Fold/Check/Call/Bet/Raise/All-in の処理
 * - アクションのバリデーション
 */

import { Player, ActionType, Action, GameState, Street } from '../../../shared/types.js';
import { getHighestBet, calculateCallAmount, calculateMinRaise } from './pot-manager.js';

export interface ActionResult {
  success: boolean;
  error?: string;
  action?: Action;
  updatedPlayer?: Player;
}

/**
 * アクションが有効かどうか検証
 */
export function validateAction(
  state: GameState,
  player: Player,
  actionType: ActionType,
  amount?: number
): { valid: boolean; error?: string } {
  const highestBet = getHighestBet(state.players);

  switch (actionType) {
    case 'fold':
      // フォールドは常に可能
      return { valid: true };

    case 'check':
      // チェックはベットがない場合、またはBBでリンプの場合のみ
      if (player.currentBet < highestBet) {
        return { valid: false, error: 'Cannot check when there is a bet to call' };
      }
      return { valid: true };

    case 'call':
      // コールは自分より高いベットがある場合のみ
      if (player.currentBet >= highestBet) {
        return { valid: false, error: 'Nothing to call' };
      }
      return { valid: true };

    case 'bet':
      // ベットはまだ誰もベットしていない場合のみ
      if (highestBet > 0 && state.currentStreet !== 'preflop') {
        return { valid: false, error: 'Cannot bet when there is already a bet (use raise)' };
      }
      // プリフロップではBBがベット済みなのでraise扱い
      if (state.currentStreet === 'preflop' && highestBet > 0) {
        return { valid: false, error: 'Use raise in preflop' };
      }
      if (!amount || amount < state.blinds.bb) {
        return { valid: false, error: `Minimum bet is ${state.blinds.bb}` };
      }
      if (amount > player.stack) {
        return { valid: false, error: 'Bet exceeds stack' };
      }
      return { valid: true };

    case 'raise':
      // レイズはベットがある場合のみ
      const minRaise = calculateMinRaise(highestBet, state.lastRaiseAmount, state.blinds.bb);
      if (amount && amount < minRaise && amount < player.stack + player.currentBet) {
        return { valid: false, error: `Minimum raise is ${minRaise}` };
      }
      return { valid: true };

    case 'all-in':
      // オールインは常に可能（スタックがある限り）
      if (player.stack <= 0) {
        return { valid: false, error: 'No chips to go all-in' };
      }
      return { valid: true };

    default:
      return { valid: false, error: 'Unknown action' };
  }
}

/**
 * フォールドを実行
 */
export function executeFold(player: Player): Player {
  return {
    ...player,
    isFolded: true,
    isActive: false,
    hasActed: true,
  };
}

/**
 * チェックを実行
 */
export function executeCheck(player: Player): Player {
  return {
    ...player,
    hasActed: true,
  };
}

/**
 * コールを実行
 */
export function executeCall(player: Player, highestBet: number): Player {
  const callAmount = calculateCallAmount(player, highestBet);
  const isAllIn = callAmount >= player.stack;

  return {
    ...player,
    stack: player.stack - callAmount,
    currentBet: player.currentBet + callAmount,
    totalBetThisHand: player.totalBetThisHand + callAmount,
    hasActed: true,
    isAllIn,
  };
}

/**
 * ベット/レイズを実行
 */
export function executeBetOrRaise(
  player: Player,
  totalBetAmount: number
): { player: Player; raiseAmount: number } {
  // totalBetAmountは今のストリートでの合計ベット額
  const additionalAmount = totalBetAmount - player.currentBet;
  const actualAmount = Math.min(additionalAmount, player.stack);
  const isAllIn = actualAmount >= player.stack;

  const updatedPlayer: Player = {
    ...player,
    stack: player.stack - actualAmount,
    currentBet: player.currentBet + actualAmount,
    totalBetThisHand: player.totalBetThisHand + actualAmount,
    hasActed: true,
    isAllIn,
  };

  // レイズ額を計算（前のベットからの増分）
  const raiseAmount = actualAmount;

  return { player: updatedPlayer, raiseAmount };
}

/**
 * オールインを実行
 */
export function executeAllIn(player: Player): { player: Player; totalBet: number } {
  const allInAmount = player.stack;
  const totalBet = player.currentBet + allInAmount;

  const updatedPlayer: Player = {
    ...player,
    stack: 0,
    currentBet: totalBet,
    totalBetThisHand: player.totalBetThisHand + allInAmount,
    hasActed: true,
    isAllIn: true,
  };

  return { player: updatedPlayer, totalBet };
}

/**
 * アクションを処理してGameStateを更新
 */
export function processAction(
  state: GameState,
  actionType: ActionType,
  amount?: number
): { state: GameState; action: Action } | { error: string } {
  const currentPlayer = state.players[state.currentPlayerIndex];

  // バリデーション
  const validation = validateAction(state, currentPlayer, actionType, amount);
  if (!validation.valid) {
    return { error: validation.error! };
  }

  const highestBet = getHighestBet(state.players);
  let updatedPlayer: Player;
  let newLastRaiseAmount = state.lastRaiseAmount;
  let newLastAggressorIndex: number | null = state.lastAggressorIndex;

  switch (actionType) {
    case 'fold':
      updatedPlayer = executeFold(currentPlayer);
      break;

    case 'check':
      updatedPlayer = executeCheck(currentPlayer);
      break;

    case 'call':
      updatedPlayer = executeCall(currentPlayer, highestBet);
      break;

    case 'bet':
    case 'raise': {
      const betAmount = amount || highestBet + state.blinds.bb;
      const result = executeBetOrRaise(currentPlayer, betAmount);
      updatedPlayer = result.player;
      newLastRaiseAmount = result.raiseAmount;
      newLastAggressorIndex = state.currentPlayerIndex;
      break;
    }

    case 'all-in': {
      const result = executeAllIn(currentPlayer);
      updatedPlayer = result.player;
      // オールインがレイズになる場合
      if (result.totalBet > highestBet) {
        newLastRaiseAmount = result.totalBet - highestBet;
        newLastAggressorIndex = state.currentPlayerIndex;
      }
      break;
    }

    default:
      return { error: 'Unknown action type' };
  }

  // プレイヤーを更新
  const updatedPlayers = state.players.map((p, i) =>
    i === state.currentPlayerIndex ? updatedPlayer : p
  );

  // アクション履歴を追加
  const action: Action = {
    type: actionType,
    amount: actionType === 'bet' || actionType === 'raise' || actionType === 'call' || actionType === 'all-in'
      ? updatedPlayer.currentBet
      : undefined,
    playerId: currentPlayer.id,
    position: currentPlayer.position,
    street: state.currentStreet,
    timestamp: Date.now(),
  };

  const updatedState: GameState = {
    ...state,
    players: updatedPlayers,
    actionHistory: [...state.actionHistory, action],
    lastRaiseAmount: newLastRaiseAmount,
    lastAggressorIndex: newLastAggressorIndex,
  };

  return { state: updatedState, action };
}

/**
 * アクション可能なプレイヤーのオプションを取得
 */
export function getAvailableActions(
  state: GameState,
  player: Player
): { action: ActionType; minAmount?: number; maxAmount?: number }[] {
  const highestBet = getHighestBet(state.players);
  const actions: { action: ActionType; minAmount?: number; maxAmount?: number }[] = [];

  // フォールドは常に可能
  actions.push({ action: 'fold' });

  if (player.currentBet >= highestBet) {
    // チェック可能
    actions.push({ action: 'check' });
  } else {
    // コール可能
    const callAmount = calculateCallAmount(player, highestBet);
    if (callAmount < player.stack) {
      actions.push({ action: 'call', minAmount: callAmount, maxAmount: callAmount });
    }
  }

  // ベット/レイズ
  if (player.stack > 0) {
    if (highestBet === 0 || (state.currentStreet !== 'preflop' && highestBet === player.currentBet)) {
      // ベット可能
      const minBet = state.blinds.bb;
      actions.push({ action: 'bet', minAmount: minBet, maxAmount: player.stack });
    } else {
      // レイズ可能
      const minRaise = calculateMinRaise(highestBet, state.lastRaiseAmount, state.blinds.bb);
      if (minRaise <= player.stack + player.currentBet) {
        actions.push({ action: 'raise', minAmount: minRaise, maxAmount: player.stack + player.currentBet });
      }
    }

    // オールインは常に可能
    actions.push({ action: 'all-in', minAmount: player.stack, maxAmount: player.stack });
  }

  return actions;
}
