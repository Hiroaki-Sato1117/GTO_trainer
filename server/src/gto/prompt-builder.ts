/**
 * プロンプトビルダー
 * ゲーム状態をGemini APIに送信するプロンプトに変換
 */

import { GameState, Player, Card, RANK_SYMBOLS, SUIT_SYMBOLS } from '../../../shared/types.js';

/**
 * カードを文字列に変換（例: "Ah"）
 */
function cardToStr(card: Card): string {
  return `${RANK_SYMBOLS[card.rank]}${SUIT_SYMBOLS[card.suit]}`;
}

/**
 * GTO推奨プロンプトを生成
 */
export function buildGTOPrompt(state: GameState, heroPlayer: Player): string {
  const systemPrompt = buildSystemPrompt();
  const gameContext = buildGameContext(state, heroPlayer);

  return `${systemPrompt}

${gameContext}

上記の状況に対して、GTO戦略に基づく推奨アクションをJSON形式で出力してください。`;
}

/**
 * システムプロンプト（GTO知識）
 */
function buildSystemPrompt(): string {
  return `あなたはポーカーのGTO（Game Theory Optimal）戦略のエキスパートです。
テキサスホールデムのゲーム状況を分析し、数学的に最適なアクションを推奨してください。

## GTO戦略の基本原則

### プリフロップ
- ポジションが重要: BTN > CO > HJ > UTG > BB > SB
- オープンレンジはポジションで大きく変わる
- 3betレンジはバリューとブラフのバランスが重要
- コールドコールは主にIPで、インプライドオッズがある場合

### ポストフロップ
- ポジション（IP vs OOP）が極めて重要
- SPR（Stack to Pot Ratio）に応じた戦略
  - 低SPR（<3）: コミットしやすい、ベット頻度高
  - 中SPR（3-10）: バランス重視
  - 高SPR（>10）: ポットコントロール重視
- ボードテクスチャの分析
  - ドライボード: 小さいベット、高頻度
  - ウェットボード: 大きいベット、選択的

### ベットサイジング
- バリューベット: 相手のコールレンジを最大化
- ブラフ: 最小限のリスクで最大限のフォールドエクイティ
- 一般的なサイズ: 25%, 33%, 50%, 66%, 75%, 100%, 125%

### 出力形式
必ず以下のJSON形式で回答してください:
{
  "recommended_action": {
    "primary": {
      "action": "bet" | "check" | "call" | "raise" | "fold",
      "size": 数値（ベット/レイズの場合のみ）,
      "size_description": "サイズの説明（例: 2/3 pot）"
    },
    "mixed_strategy": [
      { "action": "...", "size": 数値, "frequency": 0.0-1.0 },
      ...
    ]
  },
  "reasoning": {
    "summary": "推奨理由の要約（1-2文）",
    "details": [
      "詳細な理由1",
      "詳細な理由2",
      ...
    ]
  },
  "ev_estimate": {
    "アクション名": 推定EV値,
    ...
  }
}`;
}

/**
 * ゲーム状態をコンテキストとして構築
 */
function buildGameContext(state: GameState, heroPlayer: Player): string {
  const activePlayersCount = state.players.filter(p => p.isActive && !p.isFolded).length;

  // ヒーローのホールカード
  const heroCards = heroPlayer.holeCards
    ? heroPlayer.holeCards.map(cardToStr).join(' ')
    : 'Unknown';

  // コミュニティカード
  const communityCards = state.communityCards.length > 0
    ? state.communityCards.map(cardToStr).join(' ')
    : 'なし';

  // アクション履歴
  const actionHistory = formatActionHistory(state);

  // プレイヤー情報
  const playersInfo = formatPlayersInfo(state, heroPlayer);

  // ポットオッズなど
  const highestBet = Math.max(...state.players.map(p => p.currentBet));
  const callAmount = highestBet - heroPlayer.currentBet;
  const potAfterCall = state.pot + callAmount;
  const potOdds = callAmount > 0 ? (callAmount / potAfterCall * 100).toFixed(1) : 'N/A';

  // SPR
  const effectiveStack = Math.min(
    heroPlayer.stack,
    ...state.players.filter(p => p.isActive && !p.isFolded && p.id !== heroPlayer.id).map(p => p.stack)
  );
  const spr = state.pot > 0 ? (effectiveStack / state.pot).toFixed(1) : 'N/A';

  return `## ゲーム状況

### 基本情報
- ストリート: ${translateStreet(state.currentStreet)}
- ポット: ${state.pot}チップ
- ブラインド: ${state.blinds.sb}/${state.blinds.bb}
- 残りプレイヤー数: ${activePlayersCount}人

### ヒーロー情報
- ポジション: ${heroPlayer.position}
- ホールカード: ${heroCards}
- スタック: ${heroPlayer.stack}チップ
- 現在のベット: ${heroPlayer.currentBet}チップ

### ボード
${communityCards}

### 数値指標
- コール額: ${callAmount}チップ
- ポットオッズ: ${potOdds}%
- SPR (Stack to Pot Ratio): ${spr}

### プレイヤー状況
${playersInfo}

### アクション履歴
${actionHistory}`;
}

/**
 * ストリートを日本語に変換
 */
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

/**
 * アクション履歴をフォーマット
 */
function formatActionHistory(state: GameState): string {
  if (state.actionHistory.length === 0) {
    return 'なし';
  }

  const byStreet: Record<string, string[]> = {};

  for (const action of state.actionHistory) {
    const streetName = translateStreet(action.street);
    if (!byStreet[streetName]) {
      byStreet[streetName] = [];
    }

    let actionStr = `${action.position}: ${action.type}`;
    if (action.amount !== undefined) {
      actionStr += ` ${action.amount}`;
    }
    byStreet[streetName].push(actionStr);
  }

  return Object.entries(byStreet)
    .map(([street, actions]) => `[${street}] ${actions.join(' → ')}`)
    .join('\n');
}

/**
 * プレイヤー情報をフォーマット
 */
function formatPlayersInfo(state: GameState, heroPlayer: Player): string {
  return state.players
    .filter(p => p.isActive)
    .map(p => {
      const isHero = p.id === heroPlayer.id;
      const status = p.isFolded ? '(フォールド)' : p.isAllIn ? '(オールイン)' : '';
      return `- ${p.position}${isHero ? ' (Hero)' : ''}: ${p.stack}チップ, ベット${p.currentBet} ${status}`;
    })
    .join('\n');
}
