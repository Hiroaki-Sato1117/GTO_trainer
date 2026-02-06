/**
 * アクションパネルコンポーネント
 */

import { useState } from 'react';
import type { ActionType } from '../types/types';
import { useGameStore } from '../store/gameStore';

export function ActionPanel() {
  const { availableActions, game, currentPlayer, performAction, isLoading } = useGameStore();
  const [betAmount, setBetAmount] = useState<number>(0);

  if (!game || !currentPlayer || !currentPlayer.isHero) {
    return null;
  }

  const pot = game.pot;
  const minBet = game.blinds.bb;
  const maxBet = currentPlayer.stack + currentPlayer.currentBet;

  // レイズ/ベットのアクションを探す
  const raiseAction = availableActions.find(a => a.action === 'raise');
  const betAction = availableActions.find(a => a.action === 'bet');
  const callAction = availableActions.find(a => a.action === 'call');

  const handleAction = (action: ActionType) => {
    if (action === 'bet' || action === 'raise') {
      performAction(action, betAmount || (raiseAction?.minAmount || betAction?.minAmount || minBet));
    } else {
      performAction(action);
    }
  };

  // プリセットベットサイズ
  const presets = [
    { label: '1/3', value: Math.floor(pot / 3) },
    { label: '1/2', value: Math.floor(pot / 2) },
    { label: '2/3', value: Math.floor(pot * 2 / 3) },
    { label: 'Pot', value: pot },
    { label: 'All-in', value: currentPlayer.stack },
  ];

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-4 space-y-4">
      {/* ベットスライダー（ベット/レイズが可能な場合） */}
      {(raiseAction || betAction) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-white text-sm">
            <span>ベット額: {betAmount || (raiseAction?.minAmount || betAction?.minAmount || minBet)}</span>
            <span className="text-gray-400">Max: {maxBet}</span>
          </div>

          <input
            type="range"
            min={raiseAction?.minAmount || betAction?.minAmount || minBet}
            max={maxBet}
            value={betAmount || (raiseAction?.minAmount || betAction?.minAmount || minBet)}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
              accent-blue-500"
          />

          {/* プリセットボタン */}
          <div className="flex gap-2 justify-center">
            {presets.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setBetAmount(Math.min(value, maxBet))}
                disabled={value < (raiseAction?.minAmount || betAction?.minAmount || minBet)}
                className="px-3 py-1 text-xs rounded bg-gray-700 text-white hover:bg-gray-600
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex gap-3 justify-center flex-wrap">
        {availableActions.some(a => a.action === 'fold') && (
          <button
            onClick={() => handleAction('fold')}
            disabled={isLoading}
            className="action-btn action-btn-fold disabled:opacity-50"
          >
            Fold
          </button>
        )}

        {availableActions.some(a => a.action === 'check') && (
          <button
            onClick={() => handleAction('check')}
            disabled={isLoading}
            className="action-btn action-btn-check disabled:opacity-50"
          >
            Check
          </button>
        )}

        {callAction && (
          <button
            onClick={() => handleAction('call')}
            disabled={isLoading}
            className="action-btn action-btn-call disabled:opacity-50"
          >
            Call {callAction.minAmount}
          </button>
        )}

        {betAction && (
          <button
            onClick={() => handleAction('bet')}
            disabled={isLoading}
            className="action-btn action-btn-bet disabled:opacity-50"
          >
            Bet {betAmount || betAction.minAmount}
          </button>
        )}

        {raiseAction && (
          <button
            onClick={() => handleAction('raise')}
            disabled={isLoading}
            className="action-btn action-btn-raise disabled:opacity-50"
          >
            Raise to {betAmount || raiseAction.minAmount}
          </button>
        )}

        {availableActions.some(a => a.action === 'all-in') && (
          <button
            onClick={() => handleAction('all-in')}
            disabled={isLoading}
            className="action-btn bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            All-in {currentPlayer.stack}
          </button>
        )}
      </div>
    </div>
  );
}
