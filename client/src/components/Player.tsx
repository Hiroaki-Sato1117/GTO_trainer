/**
 * プレイヤーコンポーネント
 */

import type { Player as PlayerType } from '../types/types';
import { HoleCards } from './Card';

interface PlayerProps {
  player: PlayerType;
  isActive: boolean;
  showCards: boolean;
  position: { top?: string; bottom?: string; left?: string; right?: string };
}

export function Player({ player, isActive, showCards, position }: PlayerProps) {
  const positionLabels: Record<string, { full: string; color: string }> = {
    BTN: { full: 'ボタン', color: 'bg-yellow-500' },
    SB: { full: 'SB', color: 'bg-blue-500' },
    BB: { full: 'BB', color: 'bg-green-500' },
    UTG: { full: 'UTG', color: 'bg-red-500' },
    HJ: { full: 'HJ', color: 'bg-purple-500' },
    CO: { full: 'CO', color: 'bg-orange-500' },
  };

  const posInfo = positionLabels[player.position] || { full: player.position, color: 'bg-gray-500' };

  return (
    <div
      className={`absolute flex flex-col items-center gap-2 transition-all duration-300
        ${isActive ? 'scale-110 z-10' : 'scale-100'}
        ${player.isFolded ? 'opacity-50' : 'opacity-100'}`}
      style={position}
    >
      {/* カード */}
      <div className={`${player.isFolded ? 'grayscale' : ''}`}>
        <HoleCards
          cards={player.holeCards}
          faceDown={!showCards || !player.holeCards}
          size="sm"
        />
      </div>

      {/* プレイヤー情報 */}
      <div
        className={`flex flex-col items-center p-2 rounded-lg min-w-[100px]
          ${isActive ? 'bg-yellow-500/20 ring-2 ring-yellow-400' : 'bg-black/40'}
          ${player.isHero ? 'ring-2 ring-blue-400' : ''}`}
      >
        {/* 名前とポジション */}
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded ${posInfo.color} text-white font-bold`}>
            {player.position}
          </span>
          <span className="text-white text-sm font-medium">
            {player.isHero ? '🎮 Hero' : player.name}
          </span>
        </div>

        {/* スタック */}
        <div className="text-yellow-400 font-bold text-sm mt-1">
          {player.stack.toLocaleString()}
        </div>

        {/* 現在のベット */}
        {player.currentBet > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <div className="w-4 h-4 rounded-full bg-red-600 border border-white" />
            <span className="text-white text-xs">{player.currentBet}</span>
          </div>
        )}

        {/* ステータス */}
        {player.isFolded && (
          <span className="text-red-400 text-xs mt-1">FOLD</span>
        )}
        {player.isAllIn && (
          <span className="text-yellow-300 text-xs mt-1 animate-pulse">ALL-IN!</span>
        )}
      </div>

      {/* ディーラーボタン */}
      {player.position === 'BTN' && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-black
          flex items-center justify-center text-xs font-bold border-2 border-yellow-500">
          D
        </div>
      )}
    </div>
  );
}
