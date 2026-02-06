/**
 * AIアクション履歴表示
 */

import { useGameStore } from '../store/gameStore';

export function AIActions() {
  const { aiActions, game } = useGameStore();

  if (!aiActions || aiActions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 max-h-40 overflow-y-auto">
      <div className="text-gray-400 text-xs mb-2 uppercase tracking-wider">
        AIアクション
      </div>
      <div className="space-y-2">
        {aiActions.map((action, i) => {
          const player = game?.players.find(p => p.id === action.playerId);
          return (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-gray-400 font-mono">
                {player?.position || '??'}
              </span>
              <span className="text-white">
                {action.action}
                {action.amount && ` ${action.amount}`}
              </span>
              <span className="text-gray-500 text-xs">
                ({action.reasoning})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
