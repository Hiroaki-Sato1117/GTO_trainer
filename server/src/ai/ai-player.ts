/**
 * AIプレイヤー
 * プリフロップとポストフロップのロジックを統合
 */

import { Player, GameState, ActionType, Action, Position } from '../../../shared/types.js';
import { holeCardsToNotation } from '../engine/deck.js';
import { getHighestBet } from '../engine/pot-manager.js';
import { getPreflopAction, RFI_RANGES, parseRangeAction } from './preflop-ranges.js';
import { getPostflopAction, evaluateHandStrength } from './postflop-logic.js';

export interface AIDecision {
  action: ActionType;
  amount?: number;
  reasoning: string;
}

/**
 * AIプレイヤーのアクションを決定
 */
export function getAIAction(state: GameState, player: Player): AIDecision {
  if (!player.holeCards) {
    return { action: 'fold', reasoning: 'No cards dealt' };
  }

  // プリフロップ
  if (state.currentStreet === 'preflop') {
    return getPreflopDecision(state, player);
  }

  // ポストフロップ
  return getPostflopDecision(state, player);
}

/**
 * プリフロップのアクション決定
 */
function getPreflopDecision(state: GameState, player: Player): AIDecision {
  const handNotation = holeCardsToNotation(player.holeCards!);
  const highestBet = getHighestBet(state.players);
  const position = player.position;

  // 誰もオープンしていない場合（RFI）
  const isRFI = highestBet <= state.blinds.bb;

  if (isRFI) {
    const range = RFI_RANGES[position];
    const rangeAction = range?.[handNotation];

    if (!rangeAction || rangeAction === 'F') {
      return {
        action: 'fold',
        reasoning: `${handNotation} は ${position} からのオープンレンジ外`,
      };
    }

    const parsed = parseRangeAction(rangeAction);

    // 混合戦略
    if (parsed.frequency < 100 && Math.random() * 100 >= parsed.frequency) {
      return {
        action: 'fold',
        reasoning: `${handNotation} は ${parsed.frequency}% でオープン（今回はフォールド）`,
      };
    }

    // レイズサイズ: 2.5BB + リンパー数
    const raiseSize = state.blinds.bb * 2.5;

    return {
      action: 'raise',
      amount: raiseSize,
      reasoning: `${handNotation} は ${position} からのオープンレンジ内（${parsed.frequency}%）`,
    };
  }

  // 誰かがオープン済み（vs RFI）
  return handleVsRFI(state, player, handNotation);
}

/**
 * vs RFI（誰かのオープンに対する対応）
 */
function handleVsRFI(state: GameState, player: Player, handNotation: string): AIDecision {
  const highestBet = getHighestBet(state.players);
  const handStrength = evaluatePreflopHandStrength(handNotation);

  // プレミアムハンドは3bet
  if (handStrength >= 0.85) {
    const threeBetSize = highestBet * 3;
    return {
      action: 'raise',
      amount: threeBetSize,
      reasoning: `${handNotation} はプレミアムハンド、3bet`,
    };
  }

  // 中程度のハンドはコールor3bet（混合）
  if (handStrength >= 0.5) {
    if (Math.random() < 0.3) {
      // 3betブラフ/バリュー
      const threeBetSize = highestBet * 3;
      return {
        action: 'raise',
        amount: threeBetSize,
        reasoning: `${handNotation} で3bet（バランス）`,
      };
    }
    return {
      action: 'call',
      reasoning: `${handNotation} でコール`,
    };
  }

  // ポジションが良ければスーテッドコネクターでコール
  if (handStrength >= 0.3 && isGoodPosition(player.position)) {
    if (Math.random() < 0.4) {
      return {
        action: 'call',
        reasoning: `${handNotation} はIPでインプライドオッズ狙いのコール`,
      };
    }
  }

  return {
    action: 'fold',
    reasoning: `${handNotation} はvs RFIでフォールド`,
  };
}

/**
 * ポストフロップのアクション決定
 */
function getPostflopDecision(state: GameState, player: Player): AIDecision {
  const result = getPostflopAction(state, player);
  const handStrength = evaluateHandStrength(player.holeCards!, state.communityCards);

  let reasoning = '';

  switch (result.action) {
    case 'fold':
      reasoning = `ハンド強度 ${(handStrength * 100).toFixed(0)}% でフォールド`;
      break;
    case 'check':
      reasoning = `ハンド強度 ${(handStrength * 100).toFixed(0)}% でチェック`;
      break;
    case 'call':
      reasoning = `ハンド強度 ${(handStrength * 100).toFixed(0)}% でコール`;
      break;
    case 'bet':
      reasoning = `ハンド強度 ${(handStrength * 100).toFixed(0)}% でベット`;
      break;
    case 'raise':
      reasoning = `ハンド強度 ${(handStrength * 100).toFixed(0)}% でレイズ`;
      break;
    default:
      reasoning = 'アクション決定';
  }

  return {
    action: result.action,
    amount: result.amount,
    reasoning,
  };
}

/**
 * プリフロップのハンド強度（簡易版）
 */
function evaluatePreflopHandStrength(handNotation: string): number {
  // プレミアム
  if (['AA', 'KK', 'QQ', 'AKs', 'AKo'].includes(handNotation)) return 0.95;
  if (['JJ', 'TT', 'AQs', 'AQo', 'AJs'].includes(handNotation)) return 0.85;

  // 強いハンド
  if (['99', '88', 'ATs', 'AJo', 'KQs', 'KQo', 'KJs'].includes(handNotation)) return 0.75;
  if (['77', '66', 'A9s', 'A8s', 'KTs', 'QJs', 'QTs', 'JTs'].includes(handNotation)) return 0.65;

  // 中程度
  if (['55', '44', '33', '22'].includes(handNotation)) return 0.55;
  if (handNotation.includes('A') && handNotation.endsWith('s')) return 0.50;
  if (handNotation.includes('K') && handNotation.endsWith('s')) return 0.45;

  // スーテッドコネクター
  const suitedConnectors = ['T9s', '98s', '87s', '76s', '65s', '54s'];
  if (suitedConnectors.includes(handNotation)) return 0.45;

  // オフスート高カード
  if (handNotation.includes('A') && handNotation.endsWith('o')) return 0.40;
  if (handNotation.includes('K') && handNotation.endsWith('o')) return 0.35;

  // その他
  return 0.20;
}

/**
 * 良いポジションかどうか
 */
function isGoodPosition(position: Position): boolean {
  return ['BTN', 'CO', 'HJ'].includes(position);
}

/**
 * 思考時間のディレイを取得（演出用）
 */
export function getThinkingDelay(): number {
  // 0.5秒〜2秒のランダムなディレイ
  return 500 + Math.random() * 1500;
}
