/**
 * ゲームエンジン テスト
 */

import { describe, it, expect } from 'vitest';
import {
  createDeck,
  shuffleDeck,
  dealCards,
  cardToString,
  stringToCard,
  holeCardsToNotation,
} from '../src/engine/deck.js';
import {
  evaluateHand,
  compareHands,
  determineWinners,
} from '../src/engine/hand-evaluator.js';
import {
  createGameState,
  startNewHand,
} from '../src/engine/game-state.js';
import { Card } from '../../shared/types.js';

describe('Deck', () => {
  it('should create a deck with 52 cards', () => {
    const deck = createDeck();
    expect(deck.length).toBe(52);
  });

  it('should shuffle the deck', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    expect(shuffled.length).toBe(52);
    // シャッフル後は順序が変わっているはず（稀に同じになる可能性はあるが）
    const sameOrder = deck.every((card, i) =>
      card.rank === shuffled[i].rank && card.suit === shuffled[i].suit
    );
    // 完全に同じ順序になる確率は極めて低い
    expect(sameOrder).toBe(false);
  });

  it('should deal cards correctly', () => {
    const deck = createDeck();
    const [dealt, remaining] = dealCards(deck, 5);
    expect(dealt.length).toBe(5);
    expect(remaining.length).toBe(47);
  });

  it('should convert card to string', () => {
    const card: Card = { rank: 14, suit: 'spades' };
    expect(cardToString(card)).toBe('A♠');
  });

  it('should parse string to card', () => {
    const card = stringToCard('Ah');
    expect(card.rank).toBe(14);
    expect(card.suit).toBe('hearts');
  });

  it('should convert hole cards to notation', () => {
    const pocketAces: [Card, Card] = [
      { rank: 14, suit: 'spades' },
      { rank: 14, suit: 'hearts' },
    ];
    expect(holeCardsToNotation(pocketAces)).toBe('AA');

    const akSuited: [Card, Card] = [
      { rank: 14, suit: 'hearts' },
      { rank: 13, suit: 'hearts' },
    ];
    expect(holeCardsToNotation(akSuited)).toBe('AKs');

    const akOffsuit: [Card, Card] = [
      { rank: 14, suit: 'hearts' },
      { rank: 13, suit: 'spades' },
    ];
    expect(holeCardsToNotation(akOffsuit)).toBe('AKo');
  });
});

describe('Hand Evaluator', () => {
  it('should evaluate royal flush', () => {
    const cards: Card[] = [
      { rank: 14, suit: 'hearts' },
      { rank: 13, suit: 'hearts' },
      { rank: 12, suit: 'hearts' },
      { rank: 11, suit: 'hearts' },
      { rank: 10, suit: 'hearts' },
    ];
    const result = evaluateHand(cards);
    expect(result.rank).toBe('royal-flush');
  });

  it('should evaluate straight flush', () => {
    const cards: Card[] = [
      { rank: 9, suit: 'clubs' },
      { rank: 8, suit: 'clubs' },
      { rank: 7, suit: 'clubs' },
      { rank: 6, suit: 'clubs' },
      { rank: 5, suit: 'clubs' },
    ];
    const result = evaluateHand(cards);
    expect(result.rank).toBe('straight-flush');
  });

  it('should evaluate four of a kind', () => {
    const cards: Card[] = [
      { rank: 14, suit: 'hearts' },
      { rank: 14, suit: 'diamonds' },
      { rank: 14, suit: 'clubs' },
      { rank: 14, suit: 'spades' },
      { rank: 13, suit: 'hearts' },
    ];
    const result = evaluateHand(cards);
    expect(result.rank).toBe('four-of-a-kind');
  });

  it('should evaluate full house', () => {
    const cards: Card[] = [
      { rank: 14, suit: 'hearts' },
      { rank: 14, suit: 'diamonds' },
      { rank: 14, suit: 'clubs' },
      { rank: 13, suit: 'spades' },
      { rank: 13, suit: 'hearts' },
    ];
    const result = evaluateHand(cards);
    expect(result.rank).toBe('full-house');
  });

  it('should evaluate flush', () => {
    const cards: Card[] = [
      { rank: 14, suit: 'hearts' },
      { rank: 10, suit: 'hearts' },
      { rank: 8, suit: 'hearts' },
      { rank: 6, suit: 'hearts' },
      { rank: 2, suit: 'hearts' },
    ];
    const result = evaluateHand(cards);
    expect(result.rank).toBe('flush');
  });

  it('should evaluate straight', () => {
    const cards: Card[] = [
      { rank: 10, suit: 'hearts' },
      { rank: 9, suit: 'diamonds' },
      { rank: 8, suit: 'clubs' },
      { rank: 7, suit: 'spades' },
      { rank: 6, suit: 'hearts' },
    ];
    const result = evaluateHand(cards);
    expect(result.rank).toBe('straight');
  });

  it('should evaluate wheel (A-2-3-4-5)', () => {
    const cards: Card[] = [
      { rank: 14, suit: 'hearts' },
      { rank: 2, suit: 'diamonds' },
      { rank: 3, suit: 'clubs' },
      { rank: 4, suit: 'spades' },
      { rank: 5, suit: 'hearts' },
    ];
    const result = evaluateHand(cards);
    expect(result.rank).toBe('straight');
  });

  it('should evaluate three of a kind', () => {
    const cards: Card[] = [
      { rank: 14, suit: 'hearts' },
      { rank: 14, suit: 'diamonds' },
      { rank: 14, suit: 'clubs' },
      { rank: 8, suit: 'spades' },
      { rank: 6, suit: 'hearts' },
    ];
    const result = evaluateHand(cards);
    expect(result.rank).toBe('three-of-a-kind');
  });

  it('should evaluate two pair', () => {
    const cards: Card[] = [
      { rank: 14, suit: 'hearts' },
      { rank: 14, suit: 'diamonds' },
      { rank: 13, suit: 'clubs' },
      { rank: 13, suit: 'spades' },
      { rank: 6, suit: 'hearts' },
    ];
    const result = evaluateHand(cards);
    expect(result.rank).toBe('two-pair');
  });

  it('should evaluate one pair', () => {
    const cards: Card[] = [
      { rank: 14, suit: 'hearts' },
      { rank: 14, suit: 'diamonds' },
      { rank: 10, suit: 'clubs' },
      { rank: 8, suit: 'spades' },
      { rank: 6, suit: 'hearts' },
    ];
    const result = evaluateHand(cards);
    expect(result.rank).toBe('one-pair');
  });

  it('should evaluate high card', () => {
    const cards: Card[] = [
      { rank: 14, suit: 'hearts' },
      { rank: 10, suit: 'diamonds' },
      { rank: 8, suit: 'clubs' },
      { rank: 6, suit: 'spades' },
      { rank: 2, suit: 'hearts' },
    ];
    const result = evaluateHand(cards);
    expect(result.rank).toBe('high-card');
  });

  it('should select best 5 from 7 cards', () => {
    // ホールカード + ボードで7枚
    const cards: Card[] = [
      { rank: 14, suit: 'hearts' },  // hole
      { rank: 14, suit: 'diamonds' }, // hole
      { rank: 14, suit: 'clubs' },    // board
      { rank: 14, suit: 'spades' },   // board
      { rank: 13, suit: 'hearts' },   // board
      { rank: 2, suit: 'diamonds' },  // board
      { rank: 3, suit: 'clubs' },     // board
    ];
    const result = evaluateHand(cards);
    expect(result.rank).toBe('four-of-a-kind');
    expect(result.bestHand.length).toBe(5);
  });

  it('should compare hands correctly', () => {
    const fullHouse = evaluateHand([
      { rank: 14, suit: 'hearts' },
      { rank: 14, suit: 'diamonds' },
      { rank: 14, suit: 'clubs' },
      { rank: 13, suit: 'spades' },
      { rank: 13, suit: 'hearts' },
    ]);

    const flush = evaluateHand([
      { rank: 14, suit: 'hearts' },
      { rank: 10, suit: 'hearts' },
      { rank: 8, suit: 'hearts' },
      { rank: 6, suit: 'hearts' },
      { rank: 2, suit: 'hearts' },
    ]);

    expect(compareHands(fullHouse, flush)).toBeGreaterThan(0);
    expect(compareHands(flush, fullHouse)).toBeLessThan(0);
  });

  it('should determine winners with kicker', () => {
    const communityCards: Card[] = [
      { rank: 14, suit: 'clubs' },
      { rank: 10, suit: 'diamonds' },
      { rank: 8, suit: 'spades' },
      { rank: 6, suit: 'hearts' },
      { rank: 2, suit: 'clubs' },
    ];

    const players = [
      {
        holeCards: [
          { rank: 14, suit: 'hearts' },
          { rank: 13, suit: 'hearts' },
        ] as [Card, Card],
        playerId: 'p1',
      },
      {
        holeCards: [
          { rank: 14, suit: 'diamonds' },
          { rank: 12, suit: 'diamonds' },
        ] as [Card, Card],
        playerId: 'p2',
      },
    ];

    const result = determineWinners(players, communityCards);
    // Player 1 (AK) wins over Player 2 (AQ) with kicker
    expect(result.winnersIndices).toEqual([0]);
  });

  it('should handle chop (tie)', () => {
    const communityCards: Card[] = [
      { rank: 14, suit: 'clubs' },
      { rank: 14, suit: 'diamonds' },
      { rank: 14, suit: 'spades' },
      { rank: 13, suit: 'hearts' },
      { rank: 12, suit: 'clubs' },
    ];

    const players = [
      {
        holeCards: [
          { rank: 2, suit: 'hearts' },
          { rank: 3, suit: 'hearts' },
        ] as [Card, Card],
        playerId: 'p1',
      },
      {
        holeCards: [
          { rank: 4, suit: 'diamonds' },
          { rank: 5, suit: 'diamonds' },
        ] as [Card, Card],
        playerId: 'p2',
      },
    ];

    const result = determineWinners(players, communityCards);
    // Both players have the same hand (AAA KQ from board)
    expect(result.winnersIndices.length).toBe(2);
  });
});

describe('Game State', () => {
  it('should create a new game state', () => {
    const state = createGameState();
    expect(state.players.length).toBe(6);
    expect(state.deck.length).toBe(52);
    expect(state.communityCards.length).toBe(0);
    expect(state.handNumber).toBe(0);
  });

  it('should start a new hand', () => {
    let state = createGameState();
    state = startNewHand(state);

    expect(state.handNumber).toBe(1);
    expect(state.currentStreet).toBe('preflop');

    // 全員にホールカードが配られている
    state.players.forEach(p => {
      expect(p.holeCards).not.toBeNull();
      expect(p.holeCards!.length).toBe(2);
    });

    // ブラインドが投稿されている
    const sbPlayer = state.players.find(p => p.position === 'SB');
    const bbPlayer = state.players.find(p => p.position === 'BB');
    expect(sbPlayer?.currentBet).toBe(state.blinds.sb);
    expect(bbPlayer?.currentBet).toBe(state.blinds.bb);

    // デッキから12枚（2枚×6人）配られている
    expect(state.deck.length).toBe(52 - 12);
  });
});
