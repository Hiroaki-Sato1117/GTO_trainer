/**
 * ゲーム状態管理
 * - ハンドの初期化
 * - ストリート進行
 * - 勝敗判定
 */

import {
  GameState,
  Player,
  Card,
  Position,
  Street,
  Action,
  GameSettings,
  DEFAULT_GAME_SETTINGS,
  POSITIONS_6MAX,
} from '../../../shared/types.js';
import { createDeck, shuffleDeck, dealCards, dealWithBurn } from './deck.js';
import { calculateSidePots, distributePots, getHighestBet } from './pot-manager.js';
import { processAction, getAvailableActions } from './action-handler.js';

/**
 * 新しいゲーム状態を作成
 */
export function createGameState(settings: GameSettings = DEFAULT_GAME_SETTINGS): GameState {
  const players = createPlayers(settings);
  const deck = shuffleDeck(createDeck());

  return {
    id: generateId(),
    players,
    deck,
    communityCards: [],
    pot: 0,
    sidePots: [],
    currentStreet: 'preflop',
    currentPlayerIndex: 0,
    dealerIndex: 0,
    blinds: { sb: settings.smallBlind, bb: settings.bigBlind },
    ante: settings.ante,
    actionHistory: [],
    handNumber: 0,
    isHandComplete: false,
    lastRaiseAmount: settings.bigBlind,
    lastAggressorIndex: null,
  };
}

/**
 * プレイヤーを作成
 */
function createPlayers(settings: GameSettings): Player[] {
  const positions = POSITIONS_6MAX.slice(0, settings.playerCount);

  return positions.map((position, index) => ({
    id: `player-${index + 1}`,
    name: position === settings.heroPosition ? 'Hero' : `Player ${index + 1}`,
    position,
    stack: settings.initialStack,
    holeCards: null,
    isHero: position === settings.heroPosition,
    isActive: true,
    isFolded: false,
    isAllIn: false,
    currentBet: 0,
    totalBetThisHand: 0,
    hasActed: false,
  }));
}

/**
 * 新しいハンドを開始
 */
export function startNewHand(state: GameState): GameState {
  // ディーラーボタンを移動
  const newDealerIndex = (state.dealerIndex + 1) % state.players.length;

  // プレイヤーをリセット
  const resetPlayers = state.players.map((p, i) => ({
    ...p,
    position: getPositionForIndex(i, newDealerIndex, state.players.length),
    holeCards: null,
    isActive: p.stack > 0,
    isFolded: false,
    isAllIn: false,
    currentBet: 0,
    totalBetThisHand: 0,
    hasActed: false,
  }));

  // デッキをシャッフル
  const deck = shuffleDeck(createDeck());

  // ホールカードを配る
  const [holeCards, remainingDeck] = dealHoleCards(deck, resetPlayers.length);
  const playersWithCards = resetPlayers.map((p, i) => ({
    ...p,
    holeCards: holeCards[i] as [Card, Card],
  }));

  // ブラインドを投稿
  const playersWithBlinds = postBlinds(playersWithCards, newDealerIndex, state.blinds);

  // 最初にアクションするプレイヤー（UTG）を設定
  const firstToActIndex = getFirstToActIndex(playersWithBlinds, newDealerIndex, 'preflop');

  return {
    ...state,
    id: generateId(),
    players: playersWithBlinds,
    deck: remainingDeck,
    communityCards: [],
    pot: state.blinds.sb + state.blinds.bb,
    sidePots: [],
    currentStreet: 'preflop',
    currentPlayerIndex: firstToActIndex,
    dealerIndex: newDealerIndex,
    actionHistory: [],
    handNumber: state.handNumber + 1,
    isHandComplete: false,
    lastRaiseAmount: state.blinds.bb,
    lastAggressorIndex: null,
  };
}

/**
 * ホールカードを配る
 */
function dealHoleCards(deck: Card[], playerCount: number): [Card[][], Card[]] {
  const holeCards: Card[][] = [];
  let remaining = deck;

  for (let i = 0; i < playerCount; i++) {
    const [cards, newRemaining] = dealCards(remaining, 2);
    holeCards.push(cards);
    remaining = newRemaining;
  }

  return [holeCards, remaining];
}

/**
 * ブラインドを投稿
 */
function postBlinds(
  players: Player[],
  dealerIndex: number,
  blinds: { sb: number; bb: number }
): Player[] {
  const sbIndex = (dealerIndex + 1) % players.length;
  const bbIndex = (dealerIndex + 2) % players.length;

  return players.map((p, i) => {
    if (i === sbIndex) {
      const sbAmount = Math.min(blinds.sb, p.stack);
      return {
        ...p,
        stack: p.stack - sbAmount,
        currentBet: sbAmount,
        totalBetThisHand: sbAmount,
      };
    }
    if (i === bbIndex) {
      const bbAmount = Math.min(blinds.bb, p.stack);
      return {
        ...p,
        stack: p.stack - bbAmount,
        currentBet: bbAmount,
        totalBetThisHand: bbAmount,
      };
    }
    return p;
  });
}

/**
 * ポジションを取得
 * BTNから時計回りに: BTN -> SB -> BB -> UTG -> HJ -> CO
 */
function getPositionForIndex(
  playerIndex: number,
  dealerIndex: number,
  playerCount: number
): Position {
  // BTNからの相対位置
  const offset = (playerIndex - dealerIndex + playerCount) % playerCount;
  // BTNから始まる順序
  const positionsFromBtn: Position[] = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'];
  return positionsFromBtn[offset];
}

/**
 * 最初にアクションするプレイヤーのインデックスを取得
 */
function getFirstToActIndex(players: Player[], dealerIndex: number, street: Street): number {
  if (street === 'preflop') {
    // プリフロップはUTG（BB+1）から
    return (dealerIndex + 3) % players.length;
  } else {
    // ポストフロップはSB（ディーラー+1）から
    // ただしアクティブなプレイヤーのみ
    for (let i = 1; i <= players.length; i++) {
      const index = (dealerIndex + i) % players.length;
      if (players[index].isActive && !players[index].isFolded && !players[index].isAllIn) {
        return index;
      }
    }
    return dealerIndex;
  }
}

/**
 * 次のプレイヤーに移動
 */
export function moveToNextPlayer(state: GameState): GameState {
  let nextIndex = state.currentPlayerIndex;

  // アクティブなプレイヤーを探す
  for (let i = 0; i < state.players.length; i++) {
    nextIndex = (nextIndex + 1) % state.players.length;
    const player = state.players[nextIndex];
    if (player.isActive && !player.isFolded && !player.isAllIn) {
      return { ...state, currentPlayerIndex: nextIndex };
    }
  }

  return state;
}

/**
 * ベッティングラウンドが終了したかチェック
 */
export function isBettingRoundComplete(state: GameState): boolean {
  const activePlayers = state.players.filter(p => p.isActive && !p.isFolded && !p.isAllIn);

  // 1人以下ならラウンド終了
  if (activePlayers.length <= 1) {
    return true;
  }

  const highestBet = getHighestBet(state.players);

  // 全員がアクション済みで、ベット額が揃っているか
  const allActed = activePlayers.every(p => p.hasActed);
  const allBetsEqual = activePlayers.every(p => p.currentBet === highestBet);

  return allActed && allBetsEqual;
}

/**
 * 次のストリートに進む
 */
export function advanceToNextStreet(state: GameState): GameState {
  const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  const currentIndex = streetOrder.indexOf(state.currentStreet);

  if (currentIndex >= streetOrder.length - 1) {
    return state; // すでにショーダウン
  }

  const nextStreet = streetOrder[currentIndex + 1];
  let newCommunityCards = [...state.communityCards];
  let newDeck = [...state.deck];

  // コミュニティカードを配る
  if (nextStreet === 'flop') {
    const [cards, remaining] = dealWithBurn(newDeck, 3);
    newCommunityCards = cards;
    newDeck = remaining;
  } else if (nextStreet === 'turn' || nextStreet === 'river') {
    const [cards, remaining] = dealWithBurn(newDeck, 1);
    newCommunityCards = [...newCommunityCards, ...cards];
    newDeck = remaining;
  }

  // プレイヤーのアクション状態をリセット
  const resetPlayers = state.players.map(p => ({
    ...p,
    currentBet: 0,
    hasActed: false,
  }));

  // ポットを計算
  const pot = resetPlayers.reduce((sum, p) => sum + p.totalBetThisHand, 0);

  // 最初にアクションするプレイヤーを設定
  const firstToActIndex = getFirstToActIndex(resetPlayers, state.dealerIndex, nextStreet);

  return {
    ...state,
    deck: newDeck,
    communityCards: newCommunityCards,
    currentStreet: nextStreet,
    currentPlayerIndex: firstToActIndex,
    players: resetPlayers,
    pot,
    lastRaiseAmount: state.blinds.bb,
    lastAggressorIndex: null,
  };
}

/**
 * ハンドが終了したかチェック
 */
export function isHandComplete(state: GameState): boolean {
  const activePlayers = state.players.filter(p => !p.isFolded);

  // 1人以外全員フォールド
  if (activePlayers.length === 1) {
    return true;
  }

  // ショーダウンまで到達
  if (state.currentStreet === 'showdown') {
    return true;
  }

  // リバーでベッティング終了
  if (state.currentStreet === 'river' && isBettingRoundComplete(state)) {
    return true;
  }

  return false;
}

/**
 * ショーダウンを実行して勝者を決定
 */
export function resolveShowdown(state: GameState): {
  state: GameState;
  winners: { playerId: string; amount: number; handDescription: string }[];
} {
  const sidePots = calculateSidePots(state.players);
  const winners = distributePots(state.players, state.communityCards, sidePots);

  // 勝者にチップを分配
  const updatedPlayers = state.players.map(p => {
    const winAmount = winners.find(w => w.playerId === p.id)?.amount || 0;
    return {
      ...p,
      stack: p.stack + winAmount,
    };
  });

  return {
    state: {
      ...state,
      players: updatedPlayers,
      isHandComplete: true,
      currentStreet: 'showdown',
      sidePots,
    },
    winners,
  };
}

/**
 * 全員フォールドで勝者決定
 */
export function resolveByFold(state: GameState): {
  state: GameState;
  winner: { playerId: string; amount: number };
} {
  const winner = state.players.find(p => !p.isFolded)!;
  const pot = state.players.reduce((sum, p) => sum + p.totalBetThisHand, 0);

  const updatedPlayers = state.players.map(p =>
    p.id === winner.id ? { ...p, stack: p.stack + pot } : p
  );

  return {
    state: {
      ...state,
      players: updatedPlayers,
      isHandComplete: true,
    },
    winner: { playerId: winner.id, amount: pot },
  };
}

/**
 * IDを生成
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// エクスポート
export { processAction, getAvailableActions };
