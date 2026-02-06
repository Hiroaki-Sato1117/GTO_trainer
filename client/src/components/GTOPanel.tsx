/**
 * GTO推奨パネルコンポーネント
 */

import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { ActionType } from '../types/types';

const actionLabels: Record<ActionType, string> = {
  fold: 'Fold',
  check: 'Check',
  call: 'Call',
  bet: 'Bet',
  raise: 'Raise',
  'all-in': 'All-in',
};

const actionColors: Record<ActionType, string> = {
  fold: 'bg-red-600',
  check: 'bg-gray-600',
  call: 'bg-green-600',
  bet: 'bg-blue-600',
  raise: 'bg-yellow-600',
  'all-in': 'bg-purple-600',
};

export function GTOPanel() {
  const { gtoRecommendation, showGTOHints, toggleGTOHints, currentPlayer } = useGameStore();
  const [showDetails, setShowDetails] = useState(false);

  // ヒーローの番でない場合は表示しない
  if (!currentPlayer?.isHero) {
    return null;
  }

  return (
    <div className="gto-bar">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-purple-300 text-lg">🎯</span>
          <span className="text-white font-bold">GTO推奨</span>
        </div>

        <button
          onClick={toggleGTOHints}
          className={`px-3 py-1 rounded text-sm transition-colors
            ${showGTOHints ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'}`}
        >
          {showGTOHints ? 'ON' : 'OFF'}
        </button>
      </div>

      {showGTOHints && gtoRecommendation ? (
        <>
          {/* 推奨アクション */}
          <div className="mb-3">
            <div className="text-gray-300 text-xs mb-1">推奨アクション</div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded ${actionColors[gtoRecommendation.primaryAction.action]} text-white font-bold`}>
                {actionLabels[gtoRecommendation.primaryAction.action]}
                {gtoRecommendation.primaryAction.size && ` ${gtoRecommendation.primaryAction.size}`}
              </span>
              {gtoRecommendation.primaryAction.sizeDescription && (
                <span className="text-gray-400 text-sm">
                  ({gtoRecommendation.primaryAction.sizeDescription})
                </span>
              )}
            </div>
          </div>

          {/* 混合戦略バー */}
          {gtoRecommendation.mixedStrategy.length > 1 && (
            <div className="mb-3">
              <div className="text-gray-300 text-xs mb-1">混合戦略</div>
              <div className="flex h-6 rounded overflow-hidden">
                {gtoRecommendation.mixedStrategy.map((strat, i) => (
                  <div
                    key={i}
                    className={`${actionColors[strat.action]} flex items-center justify-center text-white text-xs font-bold`}
                    style={{ width: `${strat.frequency * 100}%` }}
                  >
                    {strat.frequency >= 0.15 && (
                      <>
                        {actionLabels[strat.action]} {(strat.frequency * 100).toFixed(0)}%
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 理由サマリー */}
          <div className="text-white text-sm mb-2">
            {gtoRecommendation.reasoning.summary}
          </div>

          {/* 詳細トグル */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-purple-300 text-sm hover:text-purple-200 transition-colors"
          >
            {showDetails ? '▲ 詳細を閉じる' : '▼ 詳細を見る'}
          </button>

          {/* 詳細 */}
          {showDetails && (
            <div className="mt-3 p-3 bg-black/30 rounded-lg">
              <ul className="text-gray-300 text-sm space-y-1">
                {gtoRecommendation.reasoning.details.map((detail, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-purple-400">•</span>
                    {detail}
                  </li>
                ))}
              </ul>

              {/* EV推定 */}
              {gtoRecommendation.evEstimate && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="text-gray-400 text-xs mb-1">EV推定</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(gtoRecommendation.evEstimate).map(([action, ev]) => (
                      <span key={action} className="text-xs text-gray-300">
                        {action}: <span className={ev >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {ev >= 0 ? '+' : ''}{ev.toFixed(2)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : showGTOHints ? (
        <div className="text-gray-400 text-sm">
          GTO推奨を取得中...
        </div>
      ) : (
        <div className="text-gray-500 text-sm">
          GTO推奨はOFFです
        </div>
      )}
    </div>
  );
}
