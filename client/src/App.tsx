/**
 * GTO Poker Trainer - メインアプリ
 */

import { useEffect, useState } from 'react';

function App() {
  const [status, setStatus] = useState('初期化中...');
  const [game, setGame] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus('APIに接続中...');
    fetch('http://localhost:3001/api/game/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        setStatus('ゲーム取得成功！');
        setGame(data.game);
      })
      .catch(err => {
        setStatus('エラー発生');
        setError(err.message);
      });
  }, []);

  return (
    <div className="min-h-screen p-4 flex flex-col bg-green-900">
      {/* ヘッダー */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🃏</span>
          <h1 className="text-white text-2xl font-bold">GTO Poker Trainer</h1>
        </div>
      </header>

      {/* ステータス */}
      <div className="text-white mb-4">
        Status: {status}
      </div>

      {/* エラー */}
      {error && (
        <div className="bg-red-600 text-white p-4 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* ゲーム情報 */}
      {game && (
        <div className="bg-gray-800 text-white p-4 rounded">
          <p>Game ID: {game.id}</p>
          <p>Pot: {game.pot}</p>
          <p>Street: {game.currentStreet}</p>
          <p>Players: {game.players?.length}</p>
          <div className="mt-4">
            <p className="font-bold">Hero Cards:</p>
            {game.players?.find((p: any) => p.isHero)?.holeCards?.map((card: any, i: number) => (
              <span key={i} className="mr-2">
                {card.rank} of {card.suit}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
