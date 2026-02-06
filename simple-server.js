// GTO Poker Trainer - サーバー v7 (Phase 1 リファクタリング - データ分離)
import http from 'http';
import {
  RFI_RANGES,
  VS_OPEN_RANGES,
  DEFAULT_ACTION,
  getRFIRange,
  getVsOpenRange,
  getHandAction,
  getRange,
  rangeToMatrix
} from './gto-data.js';

let gameState = null;

// ============================================
// ユーティリティ関数
// ============================================

const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANK_NAMES = { 2:'2', 3:'3', 4:'4', 5:'5', 6:'6', 7:'7', 8:'8', 9:'9', 10:'T', 11:'J', 12:'Q', 13:'K', 14:'A' };

// 席順（物理的な座席 - 固定）
const SEAT_ORDER = [0, 1, 2, 3, 4, 5];

// ポジション定義（BTNから右回り）
const POSITIONS = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'];

// プリフロップアクション順序
const PREFLOP_ACTION_ORDER = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

function createDeck() {
  const deck = [];
  for (const suit of suits) {
    for (let rank = 2; rank <= 14; rank++) {
      deck.push({ rank, suit });
    }
  }
  // シャッフル
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function getHandNotation(cards) {
  if (!cards || cards.length !== 2) return null;
  const [c1, c2] = cards.sort((a, b) => b.rank - a.rank);
  const r1 = RANK_NAMES[c1.rank];
  const r2 = RANK_NAMES[c2.rank];
  const suited = c1.suit === c2.suit ? 's' : 'o';

  if (c1.rank === c2.rank) {
    return r1 + r2; // ペア
  }
  return r1 + r2 + suited;
}

// プリフロップアクション順序でプレイヤーをソート
function getActionOrder(players) {
  return [...players]
    .filter(p => !p.isFolded && p.isActive)
    .sort((a, b) => {
      const aOrder = PREFLOP_ACTION_ORDER.indexOf(a.position);
      const bOrder = PREFLOP_ACTION_ORDER.indexOf(b.position);
      return aOrder - bOrder;
    });
}

// ============================================
// ゲーム管理
// ============================================

// ポジション計算: BTNを持つプレイヤーからの距離でポジションを決定
function getPositionForPlayer(btnPlayerIndex, playerIndex) {
  // BTNからの距離（左回りで何番目か）
  const distance = (playerIndex - btnPlayerIndex + 6) % 6;
  return POSITIONS[distance]; // POSITIONS = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO']
}

function createGame(handNumber = 1, btnPlayerIndex = 0) {
  const deck = createDeck();

  // Hero は常に Player 0（インデックス0）
  const heroPlayerIndex = 0;

  const players = SEAT_ORDER.map((playerIndex) => {
    const holeCards = [deck.pop(), deck.pop()];
    const position = getPositionForPlayer(btnPlayerIndex, playerIndex);
    return {
      id: `player-${playerIndex}`,
      playerIndex: playerIndex,
      name: playerIndex === heroPlayerIndex ? 'あなた' : `Player ${playerIndex + 1}`,
      position: position,
      stack: 10000,
      holeCards: holeCards,
      isHero: playerIndex === heroPlayerIndex,
      isActive: true,
      isFolded: false,
      isAllIn: false,
      currentBet: 0,
      totalBetThisHand: 0,
      hasActed: false,
      lastAction: null,
      lastActionAmount: null
    };
  });

  // ブラインドを支払う
  const sbPlayer = players.find(p => p.position === 'SB');
  const bbPlayer = players.find(p => p.position === 'BB');
  sbPlayer.stack -= 50;
  sbPlayer.currentBet = 50;
  sbPlayer.totalBetThisHand = 50;
  bbPlayer.stack -= 100;
  bbPlayer.currentBet = 100;
  bbPlayer.totalBetThisHand = 100;

  // UTGから開始（プリフロップアクション順序の最初）
  const utgPlayer = players.find(p => p.position === 'UTG');
  const startIndex = players.indexOf(utgPlayer);

  gameState = {
    id: Date.now().toString(),
    players,
    deck,
    communityCards: [],
    pot: 150,
    sidePots: [],
    currentStreet: 'preflop',
    currentPlayerIndex: startIndex,
    btnPlayerIndex: btnPlayerIndex,
    heroPlayerIndex: heroPlayerIndex,
    blinds: { sb: 50, bb: 100 },
    ante: 0,
    actionHistory: [
      { position: 'SB', action: 'post', amount: 50, description: 'SB: Post 50' },
      { position: 'BB', action: 'post', amount: 100, description: 'BB: Post 100' }
    ],
    handNumber: handNumber,
    isHandComplete: false,
    lastRaiseAmount: 100,
    lastAggressorIndex: null,
    currentBet: 100,
    firstRaiserPosition: null,
    firstRaiserAmount: null,
    pendingAIActions: [],
    aiActionsProcessed: false
  };

  // AIアクションを事前計算（ヒーローの番まで）
  calculatePendingAIActions();

  return gameState;
}

// 次のハンドへ（BTNを左に1つ移動 = playerIndex +1）
function nextHand() {
  const newBtnPlayerIndex = (gameState.btnPlayerIndex + 1) % 6;
  const newHandNumber = gameState.handNumber + 1;

  return createGame(newHandNumber, newBtnPlayerIndex);
}

// ============================================
// AIアクション
// ============================================

function calculatePendingAIActions() {
  if (!gameState) return;

  const pendingActions = [];
  let tempState = JSON.parse(JSON.stringify(gameState));
  let currentIndex = tempState.currentPlayerIndex;

  while (true) {
    const player = tempState.players[currentIndex];

    // ヒーローに到達したら終了
    if (player.isHero) {
      break;
    }

    // フォールド済みや非アクティブはスキップ
    if (player.isFolded || !player.isActive) {
      currentIndex = getNextPlayerIndex(currentIndex, tempState.players);
      continue;
    }

    // AIのアクションを決定
    const action = decideAIAction(player, tempState);
    pendingActions.push({
      playerIndex: currentIndex,
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      action: action.action,
      amount: action.amount,
      reasoning: action.reasoning
    });

    // 仮状態を更新
    applyActionToState(tempState, currentIndex, action.action, action.amount);

    // ハンド終了チェック
    if (countActivePlayers(tempState) <= 1) {
      break;
    }

    currentIndex = getNextPlayerIndex(currentIndex, tempState.players);

    // 一周したらストリート終了チェック
    if (currentIndex === tempState.currentPlayerIndex) {
      break;
    }
  }

  gameState.pendingAIActions = pendingActions;
}

function getNextPlayerIndex(currentIndex, players) {
  // プリフロップアクション順序に基づいて次のプレイヤーを取得
  const currentPlayer = players[currentIndex];
  const actionOrder = PREFLOP_ACTION_ORDER;
  const currentOrderIndex = actionOrder.indexOf(currentPlayer.position);

  for (let i = 1; i <= 6; i++) {
    const nextOrderIndex = (currentOrderIndex + i) % 6;
    const nextPosition = actionOrder[nextOrderIndex];
    const nextPlayer = players.find(p => p.position === nextPosition);
    if (nextPlayer && !nextPlayer.isFolded && nextPlayer.isActive) {
      return players.indexOf(nextPlayer);
    }
  }
  return currentIndex;
}

function decideAIAction(player, state) {
  const handNotation = getHandNotation(player.holeCards);
  const position = player.position;
  const hasRaise = state.currentBet > state.blinds.bb;

  let rangeData;
  let situationKey;

  if (!hasRaise) {
    // RFIシチュエーション
    rangeData = RFI_RANGES[position] || {};
    situationKey = 'RFI';
  } else {
    // VS OPENシチュエーション
    const openerPosition = state.firstRaiserPosition;
    const vsOpenKey = `${position}_vs_${openerPosition}`;
    rangeData = VS_OPEN_RANGES[vsOpenKey] || {};
    situationKey = `VS_${openerPosition}`;
  }

  const actions = rangeData[handNotation] || DEFAULT_ACTION;

  // 確率に基づいてアクションを決定
  const rand = Math.random() * 100;
  let action, amount = 0;

  if (rand < actions.fold) {
    action = 'fold';
  } else if (rand < actions.fold + actions.call) {
    if (state.currentBet === 0 || (state.currentBet === player.currentBet)) {
      action = 'check';
    } else {
      action = 'call';
      amount = state.currentBet - player.currentBet;
    }
  } else {
    action = 'raise';
    // レイズ額を計算
    if (!hasRaise) {
      amount = state.blinds.bb * 2.5; // オープンレイズ
    } else {
      amount = state.currentBet * 3; // 3bet
    }
    amount = Math.min(amount, player.stack);
  }

  return {
    action,
    amount,
    reasoning: `${position}の${situationKey}レンジに基づく`
  };
}

function applyActionToState(state, playerIndex, action, amount = 0) {
  const player = state.players[playerIndex];

  switch (action) {
    case 'fold':
      player.isFolded = true;
      player.isActive = false;
      player.lastAction = 'fold';
      break;

    case 'check':
      player.lastAction = 'check';
      player.hasActed = true;
      break;

    case 'call':
      const callAmount = state.currentBet - player.currentBet;
      player.stack -= callAmount;
      player.currentBet = state.currentBet;
      player.totalBetThisHand += callAmount;
      state.pot += callAmount;
      player.lastAction = 'call';
      player.lastActionAmount = callAmount;
      player.hasActed = true;
      break;

    case 'raise':
      const raiseTotal = amount;
      const toAdd = raiseTotal - player.currentBet;
      player.stack -= toAdd;
      player.currentBet = raiseTotal;
      player.totalBetThisHand += toAdd;
      state.pot += toAdd;
      state.currentBet = raiseTotal;
      player.lastAction = 'raise';
      player.lastActionAmount = raiseTotal;
      player.hasActed = true;

      if (!state.firstRaiserPosition) {
        state.firstRaiserPosition = player.position;
        state.firstRaiserAmount = raiseTotal;
      }

      // 他のプレイヤーのhasActedをリセット
      state.players.forEach((p, i) => {
        if (i !== playerIndex && !p.isFolded) {
          p.hasActed = false;
        }
      });
      break;
  }
}

function countActivePlayers(state) {
  return state.players.filter(p => !p.isFolded && p.isActive).length;
}

function getNextAIAction() {
  if (!gameState || gameState.pendingAIActions.length === 0) {
    return null;
  }

  const action = gameState.pendingAIActions.shift();

  // 実際のゲーム状態に適用
  const playerIndex = action.playerIndex;
  applyActionToState(gameState, playerIndex, action.action, action.amount);

  // アクション履歴に記録
  gameState.actionHistory.push({
    position: action.position,
    action: action.action,
    amount: action.amount,
    description: `${action.position}: ${action.action}${action.amount ? ' ' + action.amount : ''}`
  });

  // 次のプレイヤーへ
  gameState.currentPlayerIndex = getNextPlayerIndex(playerIndex, gameState.players);

  // 自分以外全員フォールドチェック
  const activePlayers = gameState.players.filter(p => !p.isFolded && p.isActive);
  const heroWins = activePlayers.length === 1 && activePlayers[0].isHero;

  if (heroWins) {
    // ヒーローの自動勝利
    gameState.isHandComplete = true;
    gameState.heroAutoWin = true;
    gameState.pendingAIActions = []; // 残りのAIアクションをクリア
  } else if (countActivePlayers(gameState) <= 1) {
    gameState.isHandComplete = true;
  }

  return {
    ...action,
    game: gameState,
    remainingActions: gameState.pendingAIActions.length,
    heroAutoWin: heroWins
  };
}

function executeAction(player, action, amount) {
  const playerIndex = gameState.players.indexOf(player);
  applyActionToState(gameState, playerIndex, action, amount);
  player.hasActed = true;

  // 最初のレイズを記録
  if (action === 'raise' && !gameState.firstRaiserPosition) {
    gameState.firstRaiserPosition = player.position;
    gameState.firstRaiserAmount = amount;
  }
}

function checkHandComplete() {
  const activePlayers = gameState.players.filter(p => !p.isFolded && p.isActive);
  return activePlayers.length <= 1;
}

// ============================================
// GTO推奨（gto-data.jsのデータを使用）
// ============================================

function getGTORecommendation() {
  if (!gameState) return null;

  const hero = gameState.players.find(p => p.isHero);
  if (!hero) return null;

  const handNotation = getHandNotation(hero.holeCards);
  const position = hero.position;
  const bb = gameState.blinds.bb;

  // アクション履歴を分析（postとヒーロー自身を除く）
  const historyActions = gameState.actionHistory.filter(a =>
    a.action !== 'post' && a.position !== position
  );
  const raises = historyActions.filter(a => a.action === 'raise');
  const calls = historyActions.filter(a => a.action === 'call');

  // ====== 未実装シチュエーション検出 ======

  // 1. 3bet以上の状況（vs 3bet, vs 4bet）
  if (raises.length >= 2) {
    return {
      isUnimplemented: true,
      unimplementedType: 'VS_3BET_OR_MORE',
      message: '3bet/4bet への対応は未実装です',
      description: '現在のバージョンでは、オープン vs 1人の状況のみ対応しています。',
      hand_notation: handNotation
    };
  }

  // 2. コールドコールあり（オープン後にコールが入った状況）
  if (raises.length === 1 && calls.length >= 1) {
    return {
      isUnimplemented: true,
      unimplementedType: 'COLD_CALL_EXISTS',
      message: 'コールドコールありの状況は未実装です',
      description: 'オープンに対してコールが入った後のアクションは、次のバージョンで対応予定です。',
      hand_notation: handNotation
    };
  }

  const hasRaise = gameState.currentBet > bb;
  const openerPosition = gameState.firstRaiserPosition;

  let rangeData;
  let situation;
  let situationDescription;

  if (!hasRaise) {
    // RFIシチュエーション
    rangeData = RFI_RANGES[position] || {};
    situation = 'RFI';
    situationDescription = `${position}からのオープン`;
  } else {
    // VS OPENシチュエーション
    const vsOpenKey = `${position}_vs_${openerPosition}`;
    rangeData = VS_OPEN_RANGES[vsOpenKey] || {};
    situation = 'VS_OPEN';
    situationDescription = `${openerPosition}のオープンに対する${position}のアクション`;

    // レンジデータが空の場合（未実装パターン）
    if (Object.keys(rangeData).length === 0) {
      return {
        isUnimplemented: true,
        unimplementedType: 'MISSING_RANGE',
        message: `${position} vs ${openerPosition} のレンジは未実装です`,
        description: 'このポジションの組み合わせはまだデータがありません。',
        hand_notation: handNotation
      };
    }
  }

  const actions = rangeData[handNotation] || DEFAULT_ACTION;

  // 状況分析を生成
  const situation_analysis = [];
  const reasoning = [];

  if (situation === 'RFI') {
    situation_analysis.push(`あなたは${position}にいます。`);
    situation_analysis.push('まだ誰もオープンしていません。');

    if (actions.raise > 0) {
      reasoning.push(`${handNotation}は${position}からのオープンレンジに含まれます。`);
      reasoning.push(`${actions.raise}%の頻度でオープンレイズが推奨されます。`);
      if (actions.fold > 0) {
        reasoning.push(`${actions.fold}%の頻度でフォールドも混合戦略として推奨されます。`);
      }
    } else {
      reasoning.push(`${handNotation}は${position}からのオープンレンジ外です。`);
      reasoning.push('フォールドして次のハンドを待ちましょう。');
    }
  } else {
    const raiserAmount = gameState.firstRaiserAmount || bb * 2.5;
    const toCall = gameState.currentBet - hero.currentBet;

    situation_analysis.push(`${openerPosition}から${(raiserAmount / bb).toFixed(1)}BBのオープンがありました。`);
    situation_analysis.push(`あなたは${position}にいます。`);
    situation_analysis.push(`コールに必要なチップ: ${toCall}`);

    if (actions.raise > 0) {
      reasoning.push(`${handNotation}は${openerPosition}のオープンに対して3betレンジに含まれます。`);
      reasoning.push(`${actions.raise}%の頻度で3betが推奨されます。`);
    }
    if (actions.call > 0) {
      reasoning.push(`${actions.call}%の頻度でコールが推奨されます。`);
      if (handNotation.length === 2) {
        reasoning.push('ポケットペアはセットマインでコールが有効です。');
      }
    }
    if (actions.fold > 0 && actions.fold >= 50) {
      reasoning.push(`${handNotation}は${openerPosition}のレンジに対してエクイティが不足しています。`);
      reasoning.push(`${actions.fold}%の頻度でフォールドが推奨されます。`);
    }
  }

  // レイズサイズの推奨
  let raise_size_description = null;
  let raise_reasoning = null;
  let recommended_raise_amount = null;

  if (actions.raise > 0) {
    if (situation === 'RFI') {
      recommended_raise_amount = Math.round(bb * 2.5);
      raise_size_description = '2.5BB';
      raise_reasoning = '標準的なオープンサイズです。';
    } else {
      const openerAmount = gameState.firstRaiserAmount || bb * 2.5;
      recommended_raise_amount = Math.round(openerAmount * 3);
      raise_size_description = `${(recommended_raise_amount / bb).toFixed(1)}BB (3x)`;
      raise_reasoning = `${openerPosition}のオープンに対する標準的な3betサイズです。`;
    }
  }

  return {
    isUnimplemented: false,
    fold_percentage: actions.fold,
    call_percentage: actions.call,
    raise_percentage: actions.raise,
    raise_size_description,
    raise_reasoning,
    recommended_raise_amount,
    situation_analysis,
    reasoning,
    hand_notation: handNotation,
    situation: situationDescription,
    pot_odds: gameState.currentBet > hero.currentBet
      ? ((gameState.currentBet - hero.currentBet) / (gameState.pot + gameState.currentBet - hero.currentBet) * 100).toFixed(1)
      : 0,
    amount_to_call: gameState.currentBet - hero.currentBet
  };
}

// ============================================
// HTTPサーバー
// ============================================

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url;

  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // 新しいゲームを開始
  if (url === '/api/game/new' && req.method === 'POST') {
    const game = createGame();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      game,
      pendingActionsCount: game.pendingAIActions.length
    }));
    return;
  }

  // 次のハンドへ（BTNローテーション）
  if (url === '/api/game/next-hand' && req.method === 'POST') {
    if (!gameState) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No game in progress' }));
      return;
    }

    const game = nextHand();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      game,
      pendingActionsCount: game.pendingAIActions.length
    }));
    return;
  }

  // 次のAIアクションを取得
  if (url === '/api/game/next-ai-action' && req.method === 'GET') {
    const result = getNextAIAction();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      action: result,
      hasMore: result ? result.remainingActions > 0 : false
    }));
    return;
  }

  // プレイヤーのアクション
  if (url === '/api/game/action' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { action, amount } = JSON.parse(body || '{}');

      if (!gameState) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No game in progress' }));
        return;
      }

      const hero = gameState.players.find(p => p.isHero);

      // ヒーローのアクションを実行
      executeAction(hero, action, amount);

      // アクション履歴に記録
      gameState.actionHistory.push({
        position: hero.position,
        action: action,
        amount: amount || 0,
        description: `${hero.position}: ${action}${amount ? ' ' + amount : ''}`
      });

      // ハンド終了チェック（プリフロップ専用なので、アクション完了=ハンド終了）
      gameState.isHandComplete = true;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        game: gameState,
        handComplete: true
      }));
    });
    return;
  }

  // GTO推奨を取得
  if (url === '/api/game/gto-recommendation' || url.startsWith('/api/game/gto-recommendation?')) {
    const recommendation = getGTORecommendation();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ recommendation }));
    return;
  }

  // ============================================
  // 新規API: レンジデータ取得
  // ============================================

  // レンジデータを取得 (Phase 1 新規API)
  if (url.startsWith('/api/range') && req.method === 'GET') {
    const urlObj = new URL(url, 'http://localhost');
    const type = urlObj.searchParams.get('type') || 'RFI';
    const heroPosition = urlObj.searchParams.get('heroPosition');
    const openerPosition = urlObj.searchParams.get('openerPosition');

    let range;
    let title;

    if (type === 'RFI') {
      range = getRFIRange(heroPosition);
      title = `${heroPosition} RFI`;
    } else if (type === 'VS_OPEN') {
      range = getVsOpenRange(heroPosition, openerPosition);
      title = `${heroPosition} vs ${openerPosition} Open`;
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid type. Use RFI or VS_OPEN' }));
      return;
    }

    const matrix = rangeToMatrix(range);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      type,
      heroPosition,
      openerPosition,
      title,
      range,
      matrix
    }));
    return;
  }

  // ハンドアクションを取得 (Phase 1 新規API)
  if (url.startsWith('/api/hand-action') && req.method === 'GET') {
    const urlObj = new URL(url, 'http://localhost');
    const type = urlObj.searchParams.get('type') || 'RFI';
    const heroPosition = urlObj.searchParams.get('heroPosition');
    const openerPosition = urlObj.searchParams.get('openerPosition');
    const hand = urlObj.searchParams.get('hand');

    if (!hand) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'hand parameter is required' }));
      return;
    }

    let range;
    if (type === 'RFI') {
      range = getRFIRange(heroPosition);
    } else if (type === 'VS_OPEN') {
      range = getVsOpenRange(heroPosition, openerPosition);
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid type. Use RFI or VS_OPEN' }));
      return;
    }

    const action = getHandAction(range, hand);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      type,
      heroPosition,
      openerPosition,
      hand,
      action
    }));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(3001, () => {
  console.log('GTO Poker Server v8 running on http://localhost:3001');
});
