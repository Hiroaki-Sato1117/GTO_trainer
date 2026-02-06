/**
 * カードコンポーネント
 */

import type { Card as CardType } from '../types/types';
import { RANK_SYMBOLS, SUIT_SYMBOLS } from '../types/types';

interface CardProps {
  card: CardType | null;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const sizeClasses = {
  sm: 'w-10 h-14 text-sm',
  md: 'w-14 h-20 text-base',
  lg: 'w-20 h-28 text-xl',
};

const suitColors: Record<string, string> = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-gray-900',
  spades: 'text-gray-900',
};

export function Card({ card, faceDown = false, size = 'md', animate = false }: CardProps) {
  const sizeClass = sizeClasses[size];

  if (faceDown || !card) {
    return (
      <div
        className={`${sizeClass} rounded-lg shadow-lg flex items-center justify-center
          bg-gradient-to-br from-blue-800 to-blue-900 border-2 border-blue-700
          ${animate ? 'animate-deal' : ''}`}
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 3px,
            rgba(255,255,255,0.05) 3px,
            rgba(255,255,255,0.05) 6px
          )`,
        }}
      >
        <span className="text-blue-300 text-2xl">🂠</span>
      </div>
    );
  }

  const rankSymbol = RANK_SYMBOLS[card.rank];
  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const colorClass = suitColors[card.suit];

  return (
    <div
      className={`${sizeClass} rounded-lg shadow-lg flex flex-col items-center justify-center
        bg-white border-2 border-gray-200 ${animate ? 'animate-deal' : ''}`}
    >
      <span className={`font-bold ${colorClass}`}>
        {rankSymbol}
      </span>
      <span className={`${colorClass}`}>
        {suitSymbol}
      </span>
    </div>
  );
}

/**
 * ホールカードペア
 */
interface HoleCardsProps {
  cards: [CardType, CardType] | null;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function HoleCards({ cards, faceDown = false, size = 'md' }: HoleCardsProps) {
  return (
    <div className="flex gap-1">
      <Card card={cards?.[0] ?? null} faceDown={faceDown} size={size} animate />
      <Card card={cards?.[1] ?? null} faceDown={faceDown} size={size} animate />
    </div>
  );
}

/**
 * コミュニティカード（ボード）
 */
interface CommunityCardsProps {
  cards: CardType[];
}

export function CommunityCards({ cards }: CommunityCardsProps) {
  // フロップ、ターン、リバーの位置を固定
  const displayCards = [...cards];
  while (displayCards.length < 5) {
    displayCards.push(null as unknown as CardType);
  }

  return (
    <div className="flex gap-2 justify-center">
      {displayCards.map((card, i) => (
        <div key={i} className={card ? '' : 'opacity-30'}>
          {card ? (
            <Card card={card} size="lg" animate />
          ) : (
            <div className="w-20 h-28 rounded-lg border-2 border-dashed border-gray-500" />
          )}
        </div>
      ))}
    </div>
  );
}
