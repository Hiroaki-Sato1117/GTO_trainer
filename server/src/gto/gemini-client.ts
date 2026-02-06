/**
 * Gemini API クライアント
 * GTO推奨を取得するためのAPI連携
 */

import { GTORecommendation, GameState, Player, ActionType } from '../../../shared/types.js';
import { buildGTOPrompt } from './prompt-builder.js';
import { parseGTOResponse } from './response-parser.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

/**
 * Gemini APIを呼び出してGTO推奨を取得
 */
export async function getGTORecommendation(
  state: GameState,
  heroPlayer: Player,
  apiKey: string
): Promise<GTORecommendation> {
  const prompt = buildGTOPrompt(state, heroPlayer);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data: GeminiResponse = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    return parseGTOResponse(text);
  } catch (error) {
    console.error('Gemini API error:', error);
    // フォールバック: 基本的な推奨を返す
    return getDefaultRecommendation(state, heroPlayer);
  }
}

/**
 * APIエラー時のデフォルト推奨
 */
function getDefaultRecommendation(state: GameState, heroPlayer: Player): GTORecommendation {
  const defaultAction: ActionType = 'check';

  return {
    primaryAction: {
      action: defaultAction,
      frequency: 1,
    },
    mixedStrategy: [
      { action: defaultAction, frequency: 1 },
    ],
    reasoning: {
      summary: 'GTO推奨を取得できませんでした。',
      details: ['APIエラーのため、基本的なアクションを推奨します。'],
    },
  };
}

/**
 * APIキーの検証
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: 'Hello' }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 10,
        },
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}
