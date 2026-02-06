/**
 * レスポンスパーサー
 * Gemini APIのレスポンスをGTORecommendation型に変換
 */

import { GTORecommendation, GTOAction, ActionType } from '../../../shared/types.js';

interface GeminiGTOResponse {
  recommended_action: {
    primary: {
      action: string;
      size?: number;
      size_description?: string;
    };
    mixed_strategy?: {
      action: string;
      size?: number;
      frequency: number;
    }[];
  };
  reasoning: {
    summary: string;
    details: string[];
  };
  ev_estimate?: Record<string, number>;
}

/**
 * Geminiのレスポンステキストをパース
 */
export function parseGTOResponse(responseText: string): GTORecommendation {
  try {
    // JSONを抽出（マークダウンコードブロックの場合も対応）
    let jsonStr = responseText;

    // ```json ... ``` の形式の場合
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed: GeminiGTOResponse = JSON.parse(jsonStr);

    return convertToGTORecommendation(parsed);
  } catch (error) {
    console.error('Failed to parse GTO response:', error);
    console.error('Response text:', responseText);

    // パースエラー時はテキストから推奨を抽出を試みる
    return extractFromText(responseText);
  }
}

/**
 * パースしたJSONをGTORecommendation型に変換
 */
function convertToGTORecommendation(parsed: GeminiGTOResponse): GTORecommendation {
  const primaryAction = parsed.recommended_action.primary;
  const mixedStrategy = parsed.recommended_action.mixed_strategy || [];

  // アクションタイプを正規化
  const normalizedPrimary: GTOAction = {
    action: normalizeActionType(primaryAction.action),
    size: primaryAction.size,
    sizeDescription: primaryAction.size_description,
    frequency: 1,
  };

  // 混合戦略がない場合は主要アクションのみ
  const normalizedMixed: GTOAction[] = mixedStrategy.length > 0
    ? mixedStrategy.map(m => ({
        action: normalizeActionType(m.action),
        size: m.size,
        frequency: m.frequency,
      }))
    : [normalizedPrimary];

  return {
    primaryAction: normalizedPrimary,
    mixedStrategy: normalizedMixed,
    reasoning: {
      summary: parsed.reasoning?.summary || '推奨理由なし',
      details: parsed.reasoning?.details || [],
    },
    evEstimate: parsed.ev_estimate,
  };
}

/**
 * アクションタイプを正規化
 */
function normalizeActionType(action: string): ActionType {
  const normalized = action.toLowerCase().trim();

  const actionMap: Record<string, ActionType> = {
    'fold': 'fold',
    'check': 'check',
    'call': 'call',
    'bet': 'bet',
    'raise': 'raise',
    'all-in': 'all-in',
    'allin': 'all-in',
    'all in': 'all-in',
  };

  return actionMap[normalized] || 'fold';
}

/**
 * テキストから推奨を抽出（フォールバック）
 */
function extractFromText(text: string): GTORecommendation {
  const lowerText = text.toLowerCase();

  // キーワードでアクションを推測
  let action: ActionType = 'check';
  let summary = 'テキストから推奨を抽出';

  if (lowerText.includes('fold') || lowerText.includes('フォールド')) {
    action = 'fold';
    summary = 'フォールドを推奨';
  } else if (lowerText.includes('raise') || lowerText.includes('レイズ')) {
    action = 'raise';
    summary = 'レイズを推奨';
  } else if (lowerText.includes('bet') || lowerText.includes('ベット')) {
    action = 'bet';
    summary = 'ベットを推奨';
  } else if (lowerText.includes('call') || lowerText.includes('コール')) {
    action = 'call';
    summary = 'コールを推奨';
  } else if (lowerText.includes('check') || lowerText.includes('チェック')) {
    action = 'check';
    summary = 'チェックを推奨';
  }

  // サイズを抽出（例: "bet 100", "raise to 300"）
  let size: number | undefined;
  const sizeMatch = text.match(/(?:bet|raise|レイズ|ベット)\s*(?:to\s*)?(\d+)/i);
  if (sizeMatch) {
    size = parseInt(sizeMatch[1]);
  }

  // パーセンテージからサイズを抽出（例: "2/3 pot", "50%"）
  let sizeDescription: string | undefined;
  const percentMatch = text.match(/(\d+(?:\/\d+)?)\s*(?:pot|ポット|%)/i);
  if (percentMatch) {
    sizeDescription = percentMatch[0];
  }

  return {
    primaryAction: {
      action,
      size,
      sizeDescription,
      frequency: 1,
    },
    mixedStrategy: [
      { action, size, frequency: 1 },
    ],
    reasoning: {
      summary,
      details: ['APIレスポンスのパースに失敗したため、テキストから推測しました。'],
    },
  };
}

/**
 * 推奨アクションを人間が読みやすい形式に変換
 */
export function formatRecommendation(rec: GTORecommendation): string {
  const primary = rec.primaryAction;
  let actionStr = translateAction(primary.action);

  if (primary.size) {
    actionStr += ` ${primary.size}`;
  }
  if (primary.sizeDescription) {
    actionStr += ` (${primary.sizeDescription})`;
  }

  let result = `推奨: ${actionStr}\n`;
  result += `理由: ${rec.reasoning.summary}\n`;

  if (rec.mixedStrategy.length > 1) {
    result += '\n混合戦略:\n';
    for (const s of rec.mixedStrategy) {
      const pct = (s.frequency * 100).toFixed(0);
      result += `  - ${translateAction(s.action)}${s.size ? ` ${s.size}` : ''}: ${pct}%\n`;
    }
  }

  return result;
}

/**
 * アクションを日本語に変換
 */
function translateAction(action: ActionType): string {
  const translations: Record<ActionType, string> = {
    'fold': 'フォールド',
    'check': 'チェック',
    'call': 'コール',
    'bet': 'ベット',
    'raise': 'レイズ',
    'all-in': 'オールイン',
  };
  return translations[action] || action;
}
