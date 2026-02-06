/**
 * 勝者表示モーダル
 */

import { useGameStore } from '../store/gameStore';

export function WinnerModal() {
  const { winners, game, startNewHand, clearWinners } = useGameStore();

  if (!winners || winners.length === 0) {
    return null;
  }

  const isChop = winners.length > 1;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        {/* 勝者アイコン */}
        <div className="text-6xl mb-4">
          {isChop ? '🤝' : '🏆'}
        </div>

        {/* タイトル */}
        <h2 className="text-2xl font-bold text-white mb-4">
          {isChop ? 'チョップ（引き分け）' : '勝者決定！'}
        </h2>

        {/* 勝者情報 */}
        <div className="space-y-3 mb-6">
          {winners.map((winner, i) => {
            const player = game?.players.find(p => p.id === winner.playerId);
            return (
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-center gap-3 mb-2">
                  {player?.isHero && <span className="text-blue-400">🎮</span>}
                  <span className="text-white font-bold text-lg">
                    {player?.isHero ? 'Hero' : player?.name || winner.playerId}
                  </span>
                  <span className="text-gray-400 text-sm">
                    ({player?.position})
                  </span>
                </div>

                <div className="text-yellow-400 font-bold text-2xl mb-1">
                  +{winner.amount.toLocaleString()}
                </div>

                {winner.handDescription && (
                  <div className="text-gray-400 text-sm">
                    {winner.handDescription}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ボタン */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              clearWinners();
              startNewHand();
            }}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg
              transition-colors"
          >
            次のハンドへ
          </button>
        </div>
      </div>
    </div>
  );
}
