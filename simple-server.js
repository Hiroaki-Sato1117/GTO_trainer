// GTO Poker Trainer - サーバー v2
import http from 'http';

let gameState = null;

// ハンドランク（プリフロップ）- パーセンタイル形式
const HAND_RANKINGS = {
  // プレミアムハンド (トップ3%)
  'AA': 1, 'KK': 2, 'QQ': 3, 'AKs': 4, 'JJ': 5, 'AKo': 6,
  // 強いハンド (トップ10%)
  'TT': 7, 'AQs': 8, 'AJs': 9, '99': 10, 'AQo': 11, 'KQs': 12,
  '88': 13, 'ATs': 14, 'KJs': 15, 'AJo': 16, 'KQo': 17, '77': 18,
  // ミディアムハンド (トップ20%)
  'A9s': 19, 'KTs': 20, 'ATo': 21, 'QJs': 22, '66': 23, 'K9s': 24,
  'QTs': 25, 'A8s': 26, 'JTs': 27, '55': 28, 'KJo': 29, 'Q9s': 30,
  // (トップ30%)
  'A7s': 31, 'A5s': 32, 'A6s': 33, 'A4s': 34, 'T9s': 35, 'J9s': 36,
  'QJo': 37, '44': 38, 'A3s': 39, 'K8s': 40, 'A2s': 41, 'KTo': 42,
  // (トップ40%)
  'Q8s': 43, '98s': 44, 'K7s': 45, 'J8s': 46, 'QTo': 47, '33': 48,
  'T8s': 49, 'K6s': 50, 'JTo': 51, '87s': 52, 'K5s': 53, '97s': 54,
  // (トップ50%)
  'K4s': 55, '22': 56, 'K3s': 57, '76s': 58, 'Q7s': 59, 'K2s': 60,
  'Q6s': 61, '86s': 62, 'T7s': 63, 'J7s': 64, 'Q5s': 65, '65s': 66,
};

// ポジション別オープンレンジ (%)
const OPEN_RANGES = {
  'UTG': 15,
  'HJ': 18,
  'CO': 25,
  'BTN': 40,
  'SB': 35,
  'BB': 100 // BBはオープンしない（チェック）
};

// ポジション別3betレンジ (対オープンポジション別)
const THREE_BET_RANGES = {
  'vs_UTG': { 'HJ': 4, 'CO': 5, 'BTN': 6, 'SB': 7, 'BB': 8 },
  'vs_HJ': { 'CO': 5, 'BTN': 6, 'SB': 7, 'BB': 8 },
  'vs_CO': { 'BTN': 8, 'SB': 9, 'BB': 10 },
  'vs_BTN': { 'SB': 10, 'BB': 12 },
  'vs_SB': { 'BB': 15 }
};

// ポジション別コールレンジ (対オープンポジション別)
const CALL_RANGES = {
  'vs_UTG': { 'HJ': 6, 'CO': 8, 'BTN': 10, 'SB': 5, 'BB': 12 },
  'vs_HJ': { 'CO': 8, 'BTN': 12, 'SB': 6, 'BB': 14 },
  'vs_CO': { 'BTN': 15, 'SB': 8, 'BB': 16 },
  'vs_BTN': { 'SB': 10, 'BB': 18 },
  'vs_SB': { 'BB': 25 }
};

const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANK_NAMES = { 2:'2', 3:'3', 4:'4', 5:'5', 6:'6', 7:'7', 8:'8', 9:'9', 10:'T', 11:'J', 12:'Q', 13:'K', 14:'A' };

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

function getHandRank(cards) {
  const notation = getHandNotation(cards);
  return HAND_RANKINGS[notation] || 80; // ランク外は80
}

// ハンド強度をパーセンタイルに変換 (1.0 = 最強, 0.0 = 最弱)
function getHandStrength(cards) {
  const rank = getHandRank(cards);
  // rank 1 = 100%, rank 169 = 0%
  return Math.max(0, 1 - (rank - 1) / 168);
}

function createGame() {
  const positions = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'];
  const deck = createDeck();

  // ヒーローはランダムなポジション
  const heroIndex = Math.floor(Math.random() * 6);

  const players = positions.map((pos, i) => {
    const holeCards = [deck.pop(), deck.pop()];
    return {
      id: `player-${i + 1}`,
      name: i === heroIndex ? 'Hero' : `Player ${i + 1}`,
      position: pos,
      stack: 10000,
      holeCards: holeCards,
      isHero: i === heroIndex,
      isActive: true,
      isFolded: false,
      isAllIn: false,
      currentBet: 0,
      totalBetThisHand: 0,
      hasActed: false,
      lastAction: null,      // 最後のアクション
      lastActionAmount: null // 最後のアクション額
    };
  });

  // ブラインドを支払う
  const sbIndex = positions.indexOf('SB');
  const bbIndex = positions.indexOf('BB');
  players[sbIndex].stack -= 50;
  players[sbIndex].currentBet = 50;
  players[sbIndex].totalBetThisHand = 50;
  players[bbIndex].stack -= 100;
  players[bbIndex].currentBet = 100;
  players[bbIndex].totalBetThisHand = 100;

  // UTGから開始
  const utgIndex = positions.indexOf('UTG');

  gameState = {
    id: Date.now().toString(),
    players,
    deck,
    communityCards: [],
    pot: 150,
    sidePots: [],
    currentStreet: 'preflop',
    currentPlayerIndex: utgIndex,
    dealerIndex: 0,
    blinds: { sb: 50, bb: 100 },
    ante: 0,
    actionHistory: [
      { position: 'SB', action: 'post', amount: 50, description: 'SB: Post 50' },
      { position: 'BB', action: 'post', amount: 100, description: 'BB: Post 100' }
    ],
    handNumber: 1,
    isHandComplete: false,
    lastRaiseAmount: 100,
    lastAggressorIndex: null,
    currentBet: 100,
    firstRaiserPosition: null,  // 最初にレイズしたポジション
    firstRaiserAmount: null,    // 最初のレイズ額
    pendingAIActions: [],       // まだ表示していないAIアクション
    aiActionsProcessed: false   // AIアクションが処理済みか
  };

  // AIアクションを事前計算（ヒーローの番まで）
  calculatePendingAIActions();

  return gameState;
}

// ヒーローの番までのAIアクションを事前計算
function calculatePendingAIActions() {
  if (!gameState) return;

  const pendingActions = [];
  let tempState = JSON.parse(JSON.stringify(gameState)); // 状態のコピー
  let currentIndex = tempState.currentPlayerIndex;

  while (true) {
    const player = tempState.players[currentIndex];

    // ヒーローに到達したら終了
    if (player.isHero) {
      break;
    }

    // フォールド済みや非アクティブはスキップ
    if (player.isFolded || !player.isActive) {
      currentIndex = (currentIndex + 1) % 6;
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

    currentIndex = (currentIndex + 1) % 6;

    // 一周したらストリート終了チェック
    if (currentIndex === tempState.currentPlayerIndex) {
      break;
    }
  }

  gameState.pendingAIActions = pendingActions;
}

function countActivePlayers(state) {
  return state.players.filter(p => !p.isFolded && p.isActive).length;
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
      break;

    case 'call':
      const callAmount = state.currentBet - player.currentBet;
      player.stack -= callAmount;
      player.currentBet = state.currentBet;
      player.totalBetThisHand += callAmount;
      state.pot += callAmount;
      player.lastAction = 'call';
      player.lastActionAmount = callAmount;
      break;

    case 'raise':
      const raiseAmount = amount || state.currentBet * 2;
      const additionalBet = raiseAmount - player.currentBet;
      player.stack -= additionalBet;
      player.currentBet = raiseAmount;
      player.totalBetThisHand += additionalBet;
      state.pot += additionalBet;
      state.currentBet = raiseAmount;
      state.lastRaiseAmount = raiseAmount;
      player.lastAction = 'raise';
      player.lastActionAmount = raiseAmount;

      // 最初のレイザーを記録
      if (!state.firstRaiserPosition) {
        state.firstRaiserPosition = player.position;
        state.firstRaiserAmount = raiseAmount;
      }
      break;

    case 'all-in':
      const allinAmount = player.stack;
      state.pot += allinAmount;
      player.currentBet += allinAmount;
      player.totalBetThisHand += allinAmount;
      if (player.currentBet > state.currentBet) {
        state.currentBet = player.currentBet;
      }
      player.stack = 0;
      player.isAllIn = true;
      player.lastAction = 'all-in';
      player.lastActionAmount = allinAmount;
      break;
  }

  player.hasActed = true;
}

function decideAIAction(player, state) {
  const handStrength = getHandStrength(player.holeCards);
  const position = player.position;
  const toCall = state.currentBet - player.currentBet;
  const bb = state.blinds.bb;

  // 誰かがすでにレイズしているか
  const hasRaiseBefore = state.currentBet > bb;
  const raiserPosition = state.firstRaiserPosition;

  if (!hasRaiseBefore) {
    // オープンの状況
    const openRange = OPEN_RANGES[position] / 100;

    if (handStrength >= (1 - openRange)) {
      // オープンレイズ（2.5BB）
      const raiseSize = Math.round(bb * 2.5);
      return {
        action: 'raise',
        amount: raiseSize,
        reasoning: `${position}から${(openRange * 100).toFixed(0)}%レンジでオープン`
      };
    } else {
      return { action: 'fold', reasoning: 'オープンレンジ外' };
    }
  } else {
    // 誰かがすでにレイズしている
    const threeBetRanges = THREE_BET_RANGES[`vs_${raiserPosition}`] || {};
    const callRanges = CALL_RANGES[`vs_${raiserPosition}`] || {};

    const threeBetRange = (threeBetRanges[position] || 3) / 100;
    const callRange = (callRanges[position] || 5) / 100;

    if (handStrength >= (1 - threeBetRange)) {
      // 3bet
      const threeBetSize = Math.round(state.currentBet * 3);
      return {
        action: 'raise',
        amount: threeBetSize,
        reasoning: `${raiserPosition}のオープンに対して3bet`
      };
    } else if (handStrength >= (1 - (threeBetRange + callRange))) {
      // コール
      return {
        action: 'call',
        amount: toCall,
        reasoning: `${raiserPosition}のオープンにコール`
      };
    } else {
      return { action: 'fold', reasoning: `${raiserPosition}のオープンに対してフォールド` };
    }
  }
}

// 次のAIアクションを取得して適用
function getNextAIAction() {
  if (!gameState || gameState.pendingAIActions.length === 0) {
    return null;
  }

  const nextAction = gameState.pendingAIActions.shift();

  // 実際のゲーム状態に適用
  const player = gameState.players[nextAction.playerIndex];
  applyActionToState(gameState, nextAction.playerIndex, nextAction.action, nextAction.amount);

  // アクション履歴に追加
  let description = `${nextAction.position}: `;
  switch (nextAction.action) {
    case 'fold':
      description += 'Fold';
      break;
    case 'check':
      description += 'Check';
      break;
    case 'call':
      description += `Call ${nextAction.amount}`;
      break;
    case 'raise':
      description += `Raise ${nextAction.amount}`;
      break;
    case 'all-in':
      description += `All-in ${nextAction.amount}`;
      break;
  }

  gameState.actionHistory.push({
    position: nextAction.position,
    action: nextAction.action,
    amount: nextAction.amount,
    description: description
  });

  // 次のプレイヤーに進める
  gameState.currentPlayerIndex = (nextAction.playerIndex + 1) % 6;

  return {
    ...nextAction,
    description,
    remainingActions: gameState.pendingAIActions.length,
    game: gameState
  };
}

function executeAction(player, action, amount = 0) {
  const playerIndex = gameState.players.findIndex(p => p.id === player.id);
  applyActionToState(gameState, playerIndex, action, amount);

  // アクション履歴に追加
  let description = `${player.position}: `;
  switch (action) {
    case 'fold':
      description += 'Fold';
      break;
    case 'check':
      description += 'Check';
      break;
    case 'call':
      const callAmount = gameState.currentBet - player.currentBet;
      description += `Call ${callAmount}`;
      break;
    case 'raise':
      description += `Raise ${amount}`;
      break;
    case 'all-in':
      description += `All-in ${player.stack}`;
      break;
  }

  gameState.actionHistory.push({
    position: player.position,
    action: action,
    amount: amount,
    description: description
  });
}

function processAIActionsAfterHero() {
  const aiActions = [];

  while (gameState && !gameState.isHandComplete) {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    // ヒーローの番になったら停止
    if (currentPlayer.isHero) {
      break;
    }

    // フォールド済みや非アクティブはスキップ
    if (currentPlayer.isFolded || !currentPlayer.isActive) {
      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % 6;
      continue;
    }

    // AIのアクションを決定
    const action = decideAIAction(currentPlayer, gameState);
    aiActions.push({
      playerId: currentPlayer.id,
      position: currentPlayer.position,
      action: action.action,
      amount: action.amount,
      reasoning: action.reasoning
    });

    // アクションを実行
    executeAction(currentPlayer, action.action, action.amount);

    // ハンドが終了したかチェック
    if (checkHandComplete()) {
      gameState.isHandComplete = true;
      break;
    }

    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % 6;
  }

  return aiActions;
}

function checkHandComplete() {
  const activePlayers = gameState.players.filter(p => !p.isFolded && p.isActive);
  return activePlayers.length <= 1;
}

function advanceStreet() {
  const streets = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  const currentIndex = streets.indexOf(gameState.currentStreet);

  if (currentIndex < streets.length - 1) {
    gameState.currentStreet = streets[currentIndex + 1];

    // コミュニティカードを配る
    if (gameState.currentStreet === 'flop') {
      gameState.communityCards = [gameState.deck.pop(), gameState.deck.pop(), gameState.deck.pop()];
    } else if (gameState.currentStreet === 'turn' || gameState.currentStreet === 'river') {
      gameState.communityCards.push(gameState.deck.pop());
    }

    // ベットをリセット
    gameState.players.forEach(p => {
      p.currentBet = 0;
      p.hasActed = false;
      p.lastAction = null;
      p.lastActionAmount = null;
    });
    gameState.currentBet = 0;
    gameState.firstRaiserPosition = null;
    gameState.firstRaiserAmount = null;

    // SBから開始
    gameState.currentPlayerIndex = 1;

    // AIアクションを事前計算
    calculatePendingAIActions();
  }
}

function getGTORecommendation() {
  if (!gameState) return null;

  const hero = gameState.players.find(p => p.isHero);
  if (!hero) return null;

  const handRank = getHandRank(hero.holeCards);
  const handStrength = getHandStrength(hero.holeCards);
  const handNotation = getHandNotation(hero.holeCards);
  const toCall = gameState.currentBet - hero.currentBet;
  const position = hero.position;
  const bb = gameState.blinds.bb;
  const pot = gameState.pot;

  // 前のアクション情報を収集
  const actionsBeforeHero = gameState.actionHistory.filter(a => a.action !== 'post');
  const hasRaise = gameState.currentBet > bb;
  const raiserPosition = gameState.firstRaiserPosition;
  const raiserAmount = gameState.firstRaiserAmount;

  // ポットオッズ計算
  const potOdds = toCall > 0 ? (toCall / (pot + toCall) * 100).toFixed(1) : 0;

  let fold_percentage, call_percentage, raise_percentage;
  let raise_size, raise_size_description, raise_reasoning;
  let situation_analysis = [];
  let reasoning = [];

  // 状況分析を生成
  if (!hasRaise) {
    situation_analysis.push('まだ誰もオープンしていません（リンプもありません）。');
    situation_analysis.push(`あなたのポジションは${position}です。`);
    situation_analysis.push(`${position}からのオープンレンジは約${OPEN_RANGES[position]}%です。`);
  } else {
    situation_analysis.push(`${raiserPosition}から${(raiserAmount / bb).toFixed(1)}BBのオープンレイズが入っています。`);
    situation_analysis.push(`${raiserPosition}のオープンレンジは約${OPEN_RANGES[raiserPosition]}%（タイト〜スタンダード）です。`);
    situation_analysis.push(`コールに必要なチップは${toCall}、ポットオッズは約${potOdds}%です。`);

    // 3betがあった場合
    const threeBets = actionsBeforeHero.filter(a => a.action === 'raise').length;
    if (threeBets >= 2) {
      situation_analysis.push('すでに3bet（リレイズ）が入っており、レンジはかなり狭くなっています。');
    }
  }

  // プレミアムハンド (AA, KK, QQ, AK)
  if (handRank <= 6) {
    if (!hasRaise) {
      fold_percentage = 0;
      call_percentage = 0;
      raise_percentage = 100;
      raise_size = bb * 3;
      raise_size_description = '3BB';
      reasoning = [
        `${handNotation}はプレミアムハンド（トップ3%）です。`,
        '100%の頻度でオープンレイズします。',
        `${position}からは必ずバリューを取りに行きます。`,
        'リンプ（チェックでの参加）は絶対にNGです。'
      ];
      raise_reasoning = '標準的な3BBオープン。大きすぎるとコールされにくい。';
    } else {
      fold_percentage = 0;
      call_percentage = 10;
      raise_percentage = 90;
      raise_size = Math.round(raiserAmount * 3);
      raise_size_description = `3bet (${(raise_size / bb).toFixed(1)}BB)`;
      reasoning = [
        `${handNotation}は${raiserPosition}のオープンに対して3betレンジの中核です。`,
        '90%の頻度で3betしてバリューを最大化します。',
        '10%はトラップとしてスロープレイ（コール）に回します。',
        `${raiserPosition}のレンジ（${OPEN_RANGES[raiserPosition]}%）に対してドミネートしています。`
      ];
      raise_reasoning = `${raiserPosition}のオープンに対する標準的な3xサイズ。コール頻度を最大化。`;
    }
  }
  // 強いハンド (JJ-99, AQ, KQ)
  else if (handRank <= 18) {
    if (!hasRaise) {
      fold_percentage = 0;
      call_percentage = 15;
      raise_percentage = 85;
      raise_size = Math.round(bb * 2.5);
      raise_size_description = '2.5BB';
      reasoning = [
        `${handNotation}は強いオープンハンドです（トップ10%）。`,
        '85%の頻度でオープンレイズします。',
        position === 'UTG' || position === 'HJ'
          ? 'アーリーポジションでも十分にオープンできる強さです。'
          : 'レイトポジションからは必ずオープンします。',
        '稀にリンプでトラップも選択肢に。'
      ];
      raise_reasoning = '2.5BBは効率的なオープンサイズ。';
    } else if (toCall <= bb * 3) {
      const threeBetRange = THREE_BET_RANGES[`vs_${raiserPosition}`]?.[position] || 5;
      const callRange = CALL_RANGES[`vs_${raiserPosition}`]?.[position] || 8;

      fold_percentage = 10;
      call_percentage = 55;
      raise_percentage = 35;
      raise_size = Math.round(raiserAmount * 3);
      raise_size_description = `3bet (${(raise_size / bb).toFixed(1)}BB)`;
      reasoning = [
        `${handNotation}は${raiserPosition}のオープンに対してコールレンジの上位です。`,
        `${raiserPosition}のオープンレンジ${OPEN_RANGES[raiserPosition]}%に対して良いエクイティがあります。`,
        position === 'BTN' || position === 'CO'
          ? 'ポジションがあるので3bet頻度を上げても良いです。'
          : 'ポジションがないのでコール寄りにプレイします。',
        'フォールドは相手が非常にタイトな場合のみ。'
      ];
      raise_reasoning = `3betする場合は3xサイズ。${raiserPosition}にプレッシャーを与えます。`;
    } else {
      fold_percentage = 50;
      call_percentage = 45;
      raise_percentage = 5;
      reasoning = [
        `大きなレイズに対して${handNotation}は難しいスポットです。`,
        '相手のレンジはプレミアムに偏っている可能性が高いです。',
        `ポットオッズ${potOdds}%を考慮してコールも検討できます。`,
        'ドミネートされるリスクがあることを意識してください。'
      ];
    }
  }
  // ミディアムハンド (55, A9s, KTs等)
  else if (handRank <= 30) {
    if (!hasRaise) {
      const isLatePosition = position === 'CO' || position === 'BTN';
      if (isLatePosition) {
        fold_percentage = 25;
        call_percentage = 0;
        raise_percentage = 75;
        raise_size = Math.round(bb * 2.5);
        raise_size_description = '2.5BB';
        reasoning = [
          `${handNotation}はレイトポジションからのスチール候補です。`,
          `${position}のオープンレンジ${OPEN_RANGES[position]}%に含まれます。`,
          'ブラインドをスチールできれば1.5BBの利益です。',
          '3betされたら基本的にフォールドします。'
        ];
        raise_reasoning = 'スチール目的なので小さめの2.5BB。';
      } else {
        fold_percentage = 55;
        call_percentage = 0;
        raise_percentage = 45;
        raise_size = Math.round(bb * 2.5);
        raise_size_description = '2.5BB';
        reasoning = [
          `${handNotation}はアーリーポジションではボーダーラインです。`,
          `${position}からのオープンレンジ${OPEN_RANGES[position]}%の下限に近いです。`,
          '後ろに複数のプレイヤーが控えており、3betリスクがあります。',
          'タイトにプレイすることでリークを減らせます。'
        ];
        raise_reasoning = 'オープンする場合は2.5BB。';
      }
    } else {
      // オープンがあった場合
      const isPocketPair = handNotation.length === 2; // AA, KK, 55等

      if (isPocketPair && toCall <= bb * 3) {
        // ポケットペアはセットマイン
        fold_percentage = 40;
        call_percentage = 55;
        raise_percentage = 5;
        reasoning = [
          `${handNotation}は${raiserPosition}のオープンに対してセットマイン候補です。`,
          `${raiserPosition}のオープンレンジ${OPEN_RANGES[raiserPosition]}%に対してコールできます。`,
          `スタック対ポット比（SPR）が十分あればインプライドオッズでコール可能です。`,
          'ただし、セットを引けなければポストフロップで難しくなります。'
        ];
      } else {
        fold_percentage = 70;
        call_percentage = 25;
        raise_percentage = 5;
        reasoning = [
          `${handNotation}は${raiserPosition}のオープンに対してフォールド寄りです。`,
          `${raiserPosition}のレンジ${OPEN_RANGES[raiserPosition]}%にドミネートされやすいです。`,
          `ポットオッズ${potOdds}%が良ければコールも検討できます。`,
          'コールしてもポストフロップが難しくなることが多いです。'
        ];
      }
    }
  }
  // 弱いハンド
  else {
    if (!hasRaise && (position === 'CO' || position === 'BTN')) {
      fold_percentage = 65;
      call_percentage = 0;
      raise_percentage = 35;
      raise_size = Math.round(bb * 2.5);
      raise_size_description = '2.5BB';
      reasoning = [
        `${handNotation}は基本フォールドですが、スチール狙いも可能です。`,
        `${position}からブラインドがタイトならスチール成功率が高いです。`,
        'バランスのために時々オープンに混ぜます。',
        '3betされたら即フォールドです。'
      ];
      raise_reasoning = 'スチール目的の最小サイズ。';
    } else {
      fold_percentage = 100;
      call_percentage = 0;
      raise_percentage = 0;
      reasoning = [
        `${handNotation}はフォールドが正解です。`,
        'このハンドで参加しても期待値はマイナスです。',
        hasRaise
          ? `${raiserPosition}のオープンに対してコールするエクイティがありません。`
          : 'ポストフロップでのプレイアビリティが低いです。',
        '次のハンドでより良いスポットを待ちましょう。'
      ];
    }
  }

  return {
    fold_percentage,
    call_percentage,
    raise_percentage,
    raise_size: raise_size || null,
    raise_size_description: raise_size_description || null,
    raise_reasoning: raise_reasoning || null,
    situation_analysis,
    reasoning,
    hand_notation: handNotation,
    pot_odds: potOdds,
    amount_to_call: toCall
  };
}

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

      // ハンド終了チェック
      if (checkHandComplete()) {
        gameState.isHandComplete = true;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          game: gameState,
          handComplete: true,
          winners: [{ playerId: hero.id, amount: gameState.pot }]
        }));
        return;
      }

      // 次のプレイヤーへ
      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % 6;

      // ストリート終了チェック
      const allActed = gameState.players.every(p =>
        p.isFolded || p.isAllIn || p.hasActed
      );
      const betsEqual = gameState.players
        .filter(p => !p.isFolded && !p.isAllIn)
        .every(p => p.currentBet === gameState.currentBet);

      if (allActed && betsEqual) {
        advanceStreet();
      } else {
        // AIアクションを事前計算
        calculatePendingAIActions();
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        game: gameState,
        pendingActionsCount: gameState.pendingAIActions.length,
        handComplete: gameState.isHandComplete
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

  res.writeHead(404);
  res.end('Not found');
});

server.listen(3001, () => {
  console.log('🃏 GTO Poker Server v2 running on http://localhost:3001');
});
