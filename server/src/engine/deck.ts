/**
 * デッキ管理
 * - 52枚の標準デッキ生成
 * - Fisher-Yatesシャッフル
 * - カード配布
 */

import { Card, Suit, Rank, RANK_SYMBOLS, SUIT_SYMBOLS } from '../../../shared/types.js';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

/**
 * 52枚の新しいデッキを生成
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

/**
 * Fisher-Yatesアルゴリズムでデッキをシャッフル
 * @param deck シャッフルするデッキ
 * @returns シャッフルされた新しいデッキ
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * デッキから指定枚数のカードを配る
 * @param deck デッキ
 * @param count 配る枚数
 * @returns [配られたカード, 残りのデッキ]
 */
export function dealCards(deck: Card[], count: number): [Card[], Card[]] {
  if (count > deck.length) {
    throw new Error(`Not enough cards in deck. Requested: ${count}, Available: ${deck.length}`);
  }
  const dealt = deck.slice(0, count);
  const remaining = deck.slice(count);
  return [dealt, remaining];
}

/**
 * バーンカードを1枚取り除いてから指定枚数配る
 * @param deck デッキ
 * @param count 配る枚数
 * @returns [配られたカード, 残りのデッキ]
 */
export function dealWithBurn(deck: Card[], count: number): [Card[], Card[]] {
  if (count + 1 > deck.length) {
    throw new Error(`Not enough cards in deck for burn + deal`);
  }
  // バーンカードを取り除く
  const afterBurn = deck.slice(1);
  return dealCards(afterBurn, count);
}

/**
 * カードを文字列表現に変換（例: "A♠", "K♥"）
 */
export function cardToString(card: Card): string {
  return `${RANK_SYMBOLS[card.rank]}${SUIT_SYMBOLS[card.suit]}`;
}

/**
 * 文字列からカードを生成（例: "Ah" -> { rank: 14, suit: 'hearts' }）
 */
export function stringToCard(str: string): Card {
  const rankChar = str[0].toUpperCase();
  const suitChar = str[1].toLowerCase();

  const rankMap: Record<string, Rank> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  };

  const suitMap: Record<string, Suit> = {
    'h': 'hearts',
    'd': 'diamonds',
    'c': 'clubs',
    's': 'spades',
  };

  const rank = rankMap[rankChar];
  const suit = suitMap[suitChar];

  if (!rank || !suit) {
    throw new Error(`Invalid card string: ${str}`);
  }

  return { rank, suit };
}

/**
 * 複数のカードを文字列表現に変換
 */
export function cardsToString(cards: Card[]): string {
  return cards.map(cardToString).join(' ');
}

/**
 * カードが同じかどうか比較
 */
export function cardsEqual(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

/**
 * ホールカードを短縮表記に変換（例: AKs, AKo, AA）
 */
export function holeCardsToNotation(cards: [Card, Card]): string {
  const [c1, c2] = cards;
  const r1 = RANK_SYMBOLS[c1.rank];
  const r2 = RANK_SYMBOLS[c2.rank];

  // ランクの高い方を先に
  const [high, low] = c1.rank >= c2.rank ? [r1, r2] : [r2, r1];

  if (c1.rank === c2.rank) {
    return `${high}${low}`; // ペア
  } else if (c1.suit === c2.suit) {
    return `${high}${low}s`; // スーテッド
  } else {
    return `${high}${low}o`; // オフスート
  }
}
