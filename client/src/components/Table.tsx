/**
 * テーブルコンポーネント
 */

import { useGameStore } from '../store/gameStore';
import { Player } from './Player';
import { CommunityCards } from './Card';

// 6人テーブルのプレイヤー位置（楕円上に配置）
const playerPositions = [
  { bottom: '0', left: '50%', transform: 'translateX(-50%)' },  // Hero (bottom center)
  { bottom: '15%', left: '5%' },   // Left bottom
  { top: '15%', left: '5%' },      // Left top
  { top: '0', left: '50%', transform: 'translateX(-50%)' },     // Top center
  { top: '15%', right: '5%' },     // Right top
  { bottom: '15%', right: '5%' },  // Right bottom
];

export function Table() {
  const { game, currentPlayer } = useGameStore();

  if (!game) {
    return null;
  }

  // プレイヤーをHeroを基準に並び替え
  const heroIndex = game.players.findIndex(p => p.isHero);
  const orderedPlayers = [
    ...game.players.slice(heroIndex),
    ...game.players.slice(0, heroIndex),
  ];

  return (
    <div className="relative w-full max-w-4xl mx-auto aspect-[16/10]">
      {/* テーブル */}
      <div className="poker-table absolute inset-10 flex items-center justify-center">
        {/* ポット */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="text-white text-sm mb-1">POT</div>
          <div className="bg-black/50 px-4 py-2 rounded-full">
            <span className="text-yellow-400 font-bold text-xl">
              {game.pot.toLocaleString()}
            </span>
          </div>
        </div>

        {/* コミュニティカード */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <CommunityCards cards={game.communityCards} />
        </div>

        {/* ストリート表示 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <span className="text-white/60 text-sm uppercase tracking-wider">
            {translateStreet(game.currentStreet)}
          </span>
        </div>
      </div>

      {/* プレイヤー */}
      {orderedPlayers.map((player, i) => (
        <Player
          key={player.id}
          player={player}
          isActive={currentPlayer?.id === player.id}
          showCards={player.isHero || game.currentStreet === 'showdown'}
          position={playerPositions[i]}
        />
      ))}
    </div>
  );
}

function translateStreet(street: string): string {
  const translations: Record<string, string> = {
    preflop: 'プリフロップ',
    flop: 'フロップ',
    turn: 'ターン',
    river: 'リバー',
    showdown: 'ショーダウン',
  };
  return translations[street] || street;
}
