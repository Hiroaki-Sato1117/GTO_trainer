// GTO Poker Trainer - サーバー v3 (プリフロップ専用)
import http from 'http';

let gameState = null;

// ============================================
// GTOレンジデータ (ハードコード)
// ============================================

// RFIレンジ: 各ポジションからのオープンレンジ
// 値: { fold, call, raise } の各パーセンテージ
const RFI_RANGES = {
  UTG: {
    // ペア
    'AA': { fold: 0, call: 0, raise: 100 },
    'KK': { fold: 0, call: 0, raise: 100 },
    'QQ': { fold: 0, call: 0, raise: 100 },
    'JJ': { fold: 0, call: 0, raise: 100 },
    'TT': { fold: 0, call: 0, raise: 100 },
    '99': { fold: 0, call: 0, raise: 100 },
    '88': { fold: 0, call: 0, raise: 100 },
    '77': { fold: 20, call: 0, raise: 80 },
    '66': { fold: 50, call: 0, raise: 50 },
    '55': { fold: 70, call: 0, raise: 30 },
    '44': { fold: 100, call: 0, raise: 0 },
    '33': { fold: 100, call: 0, raise: 0 },
    '22': { fold: 100, call: 0, raise: 0 },
    // Ax suited
    'AKs': { fold: 0, call: 0, raise: 100 },
    'AQs': { fold: 0, call: 0, raise: 100 },
    'AJs': { fold: 0, call: 0, raise: 100 },
    'ATs': { fold: 0, call: 0, raise: 100 },
    'A9s': { fold: 50, call: 0, raise: 50 },
    'A8s': { fold: 70, call: 0, raise: 30 },
    'A7s': { fold: 100, call: 0, raise: 0 },
    'A6s': { fold: 100, call: 0, raise: 0 },
    'A5s': { fold: 50, call: 0, raise: 50 },
    'A4s': { fold: 70, call: 0, raise: 30 },
    'A3s': { fold: 100, call: 0, raise: 0 },
    'A2s': { fold: 100, call: 0, raise: 0 },
    // Ax offsuit
    'AKo': { fold: 0, call: 0, raise: 100 },
    'AQo': { fold: 0, call: 0, raise: 100 },
    'AJo': { fold: 20, call: 0, raise: 80 },
    'ATo': { fold: 60, call: 0, raise: 40 },
    // Kx suited
    'KQs': { fold: 0, call: 0, raise: 100 },
    'KJs': { fold: 0, call: 0, raise: 100 },
    'KTs': { fold: 20, call: 0, raise: 80 },
    'K9s': { fold: 100, call: 0, raise: 0 },
    // Kx offsuit
    'KQo': { fold: 30, call: 0, raise: 70 },
    'KJo': { fold: 100, call: 0, raise: 0 },
    // Broadway suited
    'QJs': { fold: 20, call: 0, raise: 80 },
    'QTs': { fold: 50, call: 0, raise: 50 },
    'JTs': { fold: 50, call: 0, raise: 50 },
  },

  HJ: {
    'AA': { fold: 0, call: 0, raise: 100 },
    'KK': { fold: 0, call: 0, raise: 100 },
    'QQ': { fold: 0, call: 0, raise: 100 },
    'JJ': { fold: 0, call: 0, raise: 100 },
    'TT': { fold: 0, call: 0, raise: 100 },
    '99': { fold: 0, call: 0, raise: 100 },
    '88': { fold: 0, call: 0, raise: 100 },
    '77': { fold: 0, call: 0, raise: 100 },
    '66': { fold: 30, call: 0, raise: 70 },
    '55': { fold: 50, call: 0, raise: 50 },
    '44': { fold: 80, call: 0, raise: 20 },
    '33': { fold: 100, call: 0, raise: 0 },
    '22': { fold: 100, call: 0, raise: 0 },
    'AKs': { fold: 0, call: 0, raise: 100 },
    'AQs': { fold: 0, call: 0, raise: 100 },
    'AJs': { fold: 0, call: 0, raise: 100 },
    'ATs': { fold: 0, call: 0, raise: 100 },
    'A9s': { fold: 20, call: 0, raise: 80 },
    'A8s': { fold: 40, call: 0, raise: 60 },
    'A7s': { fold: 70, call: 0, raise: 30 },
    'A6s': { fold: 80, call: 0, raise: 20 },
    'A5s': { fold: 30, call: 0, raise: 70 },
    'A4s': { fold: 50, call: 0, raise: 50 },
    'A3s': { fold: 70, call: 0, raise: 30 },
    'A2s': { fold: 80, call: 0, raise: 20 },
    'AKo': { fold: 0, call: 0, raise: 100 },
    'AQo': { fold: 0, call: 0, raise: 100 },
    'AJo': { fold: 0, call: 0, raise: 100 },
    'ATo': { fold: 40, call: 0, raise: 60 },
    'KQs': { fold: 0, call: 0, raise: 100 },
    'KJs': { fold: 0, call: 0, raise: 100 },
    'KTs': { fold: 0, call: 0, raise: 100 },
    'K9s': { fold: 60, call: 0, raise: 40 },
    'KQo': { fold: 10, call: 0, raise: 90 },
    'KJo': { fold: 50, call: 0, raise: 50 },
    'QJs': { fold: 0, call: 0, raise: 100 },
    'QTs': { fold: 30, call: 0, raise: 70 },
    'JTs': { fold: 30, call: 0, raise: 70 },
    'T9s': { fold: 60, call: 0, raise: 40 },
  },

  CO: {
    'AA': { fold: 0, call: 0, raise: 100 },
    'KK': { fold: 0, call: 0, raise: 100 },
    'QQ': { fold: 0, call: 0, raise: 100 },
    'JJ': { fold: 0, call: 0, raise: 100 },
    'TT': { fold: 0, call: 0, raise: 100 },
    '99': { fold: 0, call: 0, raise: 100 },
    '88': { fold: 0, call: 0, raise: 100 },
    '77': { fold: 0, call: 0, raise: 100 },
    '66': { fold: 0, call: 0, raise: 100 },
    '55': { fold: 20, call: 0, raise: 80 },
    '44': { fold: 40, call: 0, raise: 60 },
    '33': { fold: 60, call: 0, raise: 40 },
    '22': { fold: 70, call: 0, raise: 30 },
    'AKs': { fold: 0, call: 0, raise: 100 },
    'AQs': { fold: 0, call: 0, raise: 100 },
    'AJs': { fold: 0, call: 0, raise: 100 },
    'ATs': { fold: 0, call: 0, raise: 100 },
    'A9s': { fold: 0, call: 0, raise: 100 },
    'A8s': { fold: 0, call: 0, raise: 100 },
    'A7s': { fold: 20, call: 0, raise: 80 },
    'A6s': { fold: 30, call: 0, raise: 70 },
    'A5s': { fold: 0, call: 0, raise: 100 },
    'A4s': { fold: 10, call: 0, raise: 90 },
    'A3s': { fold: 30, call: 0, raise: 70 },
    'A2s': { fold: 40, call: 0, raise: 60 },
    'AKo': { fold: 0, call: 0, raise: 100 },
    'AQo': { fold: 0, call: 0, raise: 100 },
    'AJo': { fold: 0, call: 0, raise: 100 },
    'ATo': { fold: 0, call: 0, raise: 100 },
    'A9o': { fold: 50, call: 0, raise: 50 },
    'A8o': { fold: 70, call: 0, raise: 30 },
    'KQs': { fold: 0, call: 0, raise: 100 },
    'KJs': { fold: 0, call: 0, raise: 100 },
    'KTs': { fold: 0, call: 0, raise: 100 },
    'K9s': { fold: 20, call: 0, raise: 80 },
    'K8s': { fold: 50, call: 0, raise: 50 },
    'K7s': { fold: 70, call: 0, raise: 30 },
    'KQo': { fold: 0, call: 0, raise: 100 },
    'KJo': { fold: 20, call: 0, raise: 80 },
    'KTo': { fold: 50, call: 0, raise: 50 },
    'QJs': { fold: 0, call: 0, raise: 100 },
    'QTs': { fold: 0, call: 0, raise: 100 },
    'Q9s': { fold: 40, call: 0, raise: 60 },
    'QJo': { fold: 30, call: 0, raise: 70 },
    'JTs': { fold: 0, call: 0, raise: 100 },
    'J9s': { fold: 40, call: 0, raise: 60 },
    'T9s': { fold: 20, call: 0, raise: 80 },
    '98s': { fold: 40, call: 0, raise: 60 },
    '87s': { fold: 50, call: 0, raise: 50 },
    '76s': { fold: 60, call: 0, raise: 40 },
  },

  BTN: {
    'AA': { fold: 0, call: 0, raise: 100 },
    'KK': { fold: 0, call: 0, raise: 100 },
    'QQ': { fold: 0, call: 0, raise: 100 },
    'JJ': { fold: 0, call: 0, raise: 100 },
    'TT': { fold: 0, call: 0, raise: 100 },
    '99': { fold: 0, call: 0, raise: 100 },
    '88': { fold: 0, call: 0, raise: 100 },
    '77': { fold: 0, call: 0, raise: 100 },
    '66': { fold: 0, call: 0, raise: 100 },
    '55': { fold: 0, call: 0, raise: 100 },
    '44': { fold: 0, call: 0, raise: 100 },
    '33': { fold: 20, call: 0, raise: 80 },
    '22': { fold: 30, call: 0, raise: 70 },
    'AKs': { fold: 0, call: 0, raise: 100 },
    'AQs': { fold: 0, call: 0, raise: 100 },
    'AJs': { fold: 0, call: 0, raise: 100 },
    'ATs': { fold: 0, call: 0, raise: 100 },
    'A9s': { fold: 0, call: 0, raise: 100 },
    'A8s': { fold: 0, call: 0, raise: 100 },
    'A7s': { fold: 0, call: 0, raise: 100 },
    'A6s': { fold: 0, call: 0, raise: 100 },
    'A5s': { fold: 0, call: 0, raise: 100 },
    'A4s': { fold: 0, call: 0, raise: 100 },
    'A3s': { fold: 0, call: 0, raise: 100 },
    'A2s': { fold: 0, call: 0, raise: 100 },
    'AKo': { fold: 0, call: 0, raise: 100 },
    'AQo': { fold: 0, call: 0, raise: 100 },
    'AJo': { fold: 0, call: 0, raise: 100 },
    'ATo': { fold: 0, call: 0, raise: 100 },
    'A9o': { fold: 0, call: 0, raise: 100 },
    'A8o': { fold: 20, call: 0, raise: 80 },
    'A7o': { fold: 30, call: 0, raise: 70 },
    'A6o': { fold: 40, call: 0, raise: 60 },
    'A5o': { fold: 30, call: 0, raise: 70 },
    'A4o': { fold: 40, call: 0, raise: 60 },
    'A3o': { fold: 50, call: 0, raise: 50 },
    'A2o': { fold: 60, call: 0, raise: 40 },
    'KQs': { fold: 0, call: 0, raise: 100 },
    'KJs': { fold: 0, call: 0, raise: 100 },
    'KTs': { fold: 0, call: 0, raise: 100 },
    'K9s': { fold: 0, call: 0, raise: 100 },
    'K8s': { fold: 0, call: 0, raise: 100 },
    'K7s': { fold: 10, call: 0, raise: 90 },
    'K6s': { fold: 20, call: 0, raise: 80 },
    'K5s': { fold: 30, call: 0, raise: 70 },
    'K4s': { fold: 40, call: 0, raise: 60 },
    'K3s': { fold: 50, call: 0, raise: 50 },
    'K2s': { fold: 60, call: 0, raise: 40 },
    'KQo': { fold: 0, call: 0, raise: 100 },
    'KJo': { fold: 0, call: 0, raise: 100 },
    'KTo': { fold: 0, call: 0, raise: 100 },
    'K9o': { fold: 30, call: 0, raise: 70 },
    'K8o': { fold: 50, call: 0, raise: 50 },
    'K7o': { fold: 70, call: 0, raise: 30 },
    'QJs': { fold: 0, call: 0, raise: 100 },
    'QTs': { fold: 0, call: 0, raise: 100 },
    'Q9s': { fold: 0, call: 0, raise: 100 },
    'Q8s': { fold: 20, call: 0, raise: 80 },
    'Q7s': { fold: 40, call: 0, raise: 60 },
    'Q6s': { fold: 50, call: 0, raise: 50 },
    'Q5s': { fold: 60, call: 0, raise: 40 },
    'QJo': { fold: 0, call: 0, raise: 100 },
    'QTo': { fold: 10, call: 0, raise: 90 },
    'Q9o': { fold: 50, call: 0, raise: 50 },
    'JTs': { fold: 0, call: 0, raise: 100 },
    'J9s': { fold: 0, call: 0, raise: 100 },
    'J8s': { fold: 20, call: 0, raise: 80 },
    'J7s': { fold: 50, call: 0, raise: 50 },
    'JTo': { fold: 10, call: 0, raise: 90 },
    'J9o': { fold: 60, call: 0, raise: 40 },
    'T9s': { fold: 0, call: 0, raise: 100 },
    'T8s': { fold: 10, call: 0, raise: 90 },
    'T7s': { fold: 40, call: 0, raise: 60 },
    'T9o': { fold: 40, call: 0, raise: 60 },
    '98s': { fold: 0, call: 0, raise: 100 },
    '97s': { fold: 20, call: 0, raise: 80 },
    '98o': { fold: 60, call: 0, raise: 40 },
    '87s': { fold: 0, call: 0, raise: 100 },
    '86s': { fold: 30, call: 0, raise: 70 },
    '76s': { fold: 10, call: 0, raise: 90 },
    '75s': { fold: 40, call: 0, raise: 60 },
    '65s': { fold: 20, call: 0, raise: 80 },
    '54s': { fold: 30, call: 0, raise: 70 },
  },

  SB: {
    'AA': { fold: 0, call: 0, raise: 100 },
    'KK': { fold: 0, call: 0, raise: 100 },
    'QQ': { fold: 0, call: 0, raise: 100 },
    'JJ': { fold: 0, call: 0, raise: 100 },
    'TT': { fold: 0, call: 0, raise: 100 },
    '99': { fold: 0, call: 0, raise: 100 },
    '88': { fold: 0, call: 0, raise: 100 },
    '77': { fold: 0, call: 0, raise: 100 },
    '66': { fold: 0, call: 0, raise: 100 },
    '55': { fold: 10, call: 0, raise: 90 },
    '44': { fold: 20, call: 0, raise: 80 },
    '33': { fold: 30, call: 0, raise: 70 },
    '22': { fold: 40, call: 0, raise: 60 },
    'AKs': { fold: 0, call: 0, raise: 100 },
    'AQs': { fold: 0, call: 0, raise: 100 },
    'AJs': { fold: 0, call: 0, raise: 100 },
    'ATs': { fold: 0, call: 0, raise: 100 },
    'A9s': { fold: 0, call: 0, raise: 100 },
    'A8s': { fold: 0, call: 0, raise: 100 },
    'A7s': { fold: 0, call: 0, raise: 100 },
    'A6s': { fold: 0, call: 0, raise: 100 },
    'A5s': { fold: 0, call: 0, raise: 100 },
    'A4s': { fold: 0, call: 0, raise: 100 },
    'A3s': { fold: 0, call: 0, raise: 100 },
    'A2s': { fold: 0, call: 0, raise: 100 },
    'AKo': { fold: 0, call: 0, raise: 100 },
    'AQo': { fold: 0, call: 0, raise: 100 },
    'AJo': { fold: 0, call: 0, raise: 100 },
    'ATo': { fold: 0, call: 0, raise: 100 },
    'A9o': { fold: 0, call: 0, raise: 100 },
    'A8o': { fold: 10, call: 0, raise: 90 },
    'A7o': { fold: 20, call: 0, raise: 80 },
    'A6o': { fold: 30, call: 0, raise: 70 },
    'A5o': { fold: 20, call: 0, raise: 80 },
    'A4o': { fold: 30, call: 0, raise: 70 },
    'A3o': { fold: 40, call: 0, raise: 60 },
    'A2o': { fold: 50, call: 0, raise: 50 },
    'KQs': { fold: 0, call: 0, raise: 100 },
    'KJs': { fold: 0, call: 0, raise: 100 },
    'KTs': { fold: 0, call: 0, raise: 100 },
    'K9s': { fold: 0, call: 0, raise: 100 },
    'K8s': { fold: 10, call: 0, raise: 90 },
    'K7s': { fold: 20, call: 0, raise: 80 },
    'K6s': { fold: 30, call: 0, raise: 70 },
    'K5s': { fold: 40, call: 0, raise: 60 },
    'K4s': { fold: 50, call: 0, raise: 50 },
    'K3s': { fold: 60, call: 0, raise: 40 },
    'K2s': { fold: 70, call: 0, raise: 30 },
    'KQo': { fold: 0, call: 0, raise: 100 },
    'KJo': { fold: 0, call: 0, raise: 100 },
    'KTo': { fold: 10, call: 0, raise: 90 },
    'K9o': { fold: 40, call: 0, raise: 60 },
    'K8o': { fold: 60, call: 0, raise: 40 },
    'QJs': { fold: 0, call: 0, raise: 100 },
    'QTs': { fold: 0, call: 0, raise: 100 },
    'Q9s': { fold: 10, call: 0, raise: 90 },
    'Q8s': { fold: 30, call: 0, raise: 70 },
    'Q7s': { fold: 50, call: 0, raise: 50 },
    'Q6s': { fold: 60, call: 0, raise: 40 },
    'Q5s': { fold: 50, call: 0, raise: 50 },
    'QJo': { fold: 10, call: 0, raise: 90 },
    'QTo': { fold: 30, call: 0, raise: 70 },
    'Q9o': { fold: 60, call: 0, raise: 40 },
    'JTs': { fold: 0, call: 0, raise: 100 },
    'J9s': { fold: 10, call: 0, raise: 90 },
    'J8s': { fold: 30, call: 0, raise: 70 },
    'J7s': { fold: 60, call: 0, raise: 40 },
    'JTo': { fold: 20, call: 0, raise: 80 },
    'J9o': { fold: 60, call: 0, raise: 40 },
    'T9s': { fold: 0, call: 0, raise: 100 },
    'T8s': { fold: 20, call: 0, raise: 80 },
    'T7s': { fold: 50, call: 0, raise: 50 },
    'T9o': { fold: 50, call: 0, raise: 50 },
    '98s': { fold: 10, call: 0, raise: 90 },
    '97s': { fold: 30, call: 0, raise: 70 },
    '87s': { fold: 20, call: 0, raise: 80 },
    '86s': { fold: 40, call: 0, raise: 60 },
    '76s': { fold: 30, call: 0, raise: 70 },
    '75s': { fold: 50, call: 0, raise: 50 },
    '65s': { fold: 40, call: 0, raise: 60 },
    '54s': { fold: 50, call: 0, raise: 50 },
  }
};

// VS OPEN レンジ: 各オープナーに対する3bet/コール/フォールド頻度
const VS_OPEN_RANGES = {
  // BBがSBのオープンに対して
  BB_vs_SB: {
    'AA': { fold: 0, call: 0, raise: 100 },
    'KK': { fold: 0, call: 0, raise: 100 },
    'QQ': { fold: 0, call: 0, raise: 100 },
    'JJ': { fold: 0, call: 15, raise: 85 },
    'TT': { fold: 0, call: 30, raise: 70 },
    '99': { fold: 0, call: 50, raise: 50 },
    '88': { fold: 0, call: 60, raise: 40 },
    '77': { fold: 0, call: 70, raise: 30 },
    '66': { fold: 10, call: 70, raise: 20 },
    '55': { fold: 15, call: 70, raise: 15 },
    '44': { fold: 25, call: 65, raise: 10 },
    '33': { fold: 30, call: 60, raise: 10 },
    '22': { fold: 35, call: 55, raise: 10 },
    'AKs': { fold: 0, call: 0, raise: 100 },
    'AQs': { fold: 0, call: 10, raise: 90 },
    'AJs': { fold: 0, call: 25, raise: 75 },
    'ATs': { fold: 0, call: 35, raise: 65 },
    'A9s': { fold: 0, call: 50, raise: 50 },
    'A8s': { fold: 0, call: 55, raise: 45 },
    'A7s': { fold: 0, call: 60, raise: 40 },
    'A6s': { fold: 0, call: 60, raise: 40 },
    'A5s': { fold: 0, call: 40, raise: 60 },
    'A4s': { fold: 0, call: 50, raise: 50 },
    'A3s': { fold: 0, call: 55, raise: 45 },
    'A2s': { fold: 0, call: 60, raise: 40 },
    'AKo': { fold: 0, call: 0, raise: 100 },
    'AQo': { fold: 0, call: 20, raise: 80 },
    'AJo': { fold: 0, call: 40, raise: 60 },
    'ATo': { fold: 0, call: 55, raise: 45 },
    'A9o': { fold: 10, call: 60, raise: 30 },
    'A8o': { fold: 15, call: 60, raise: 25 },
    'A7o': { fold: 20, call: 60, raise: 20 },
    'A6o': { fold: 25, call: 60, raise: 15 },
    'A5o': { fold: 20, call: 55, raise: 25 },
    'A4o': { fold: 25, call: 55, raise: 20 },
    'A3o': { fold: 30, call: 55, raise: 15 },
    'A2o': { fold: 35, call: 55, raise: 10 },
    'KQs': { fold: 0, call: 20, raise: 80 },
    'KJs': { fold: 0, call: 35, raise: 65 },
    'KTs': { fold: 0, call: 45, raise: 55 },
    'K9s': { fold: 0, call: 60, raise: 40 },
    'K8s': { fold: 10, call: 65, raise: 25 },
    'K7s': { fold: 15, call: 65, raise: 20 },
    'K6s': { fold: 15, call: 65, raise: 20 },
    'K5s': { fold: 20, call: 60, raise: 20 },
    'K4s': { fold: 25, call: 60, raise: 15 },
    'K3s': { fold: 30, call: 55, raise: 15 },
    'K2s': { fold: 35, call: 55, raise: 10 },
    'KQo': { fold: 0, call: 30, raise: 70 },
    'KJo': { fold: 0, call: 50, raise: 50 },
    'KTo': { fold: 5, call: 60, raise: 35 },
    'K9o': { fold: 15, call: 65, raise: 20 },
    'K8o': { fold: 30, call: 60, raise: 10 },
    'K7o': { fold: 40, call: 55, raise: 5 },
    'K6o': { fold: 50, call: 45, raise: 5 },
    'K5o': { fold: 55, call: 40, raise: 5 },
    'QJs': { fold: 0, call: 40, raise: 60 },
    'QTs': { fold: 0, call: 50, raise: 50 },
    'Q9s': { fold: 5, call: 60, raise: 35 },
    'Q8s': { fold: 15, call: 65, raise: 20 },
    'Q7s': { fold: 25, call: 60, raise: 15 },
    'Q6s': { fold: 30, call: 55, raise: 15 },
    'Q5s': { fold: 35, call: 50, raise: 15 },
    'Q4s': { fold: 40, call: 50, raise: 10 },
    'Q3s': { fold: 45, call: 45, raise: 10 },
    'Q2s': { fold: 50, call: 40, raise: 10 },
    'QJo': { fold: 5, call: 55, raise: 40 },
    'QTo': { fold: 10, call: 60, raise: 30 },
    'Q9o': { fold: 25, call: 60, raise: 15 },
    'Q8o': { fold: 40, call: 50, raise: 10 },
    'JTs': { fold: 0, call: 50, raise: 50 },
    'J9s': { fold: 5, call: 60, raise: 35 },
    'J8s': { fold: 15, call: 65, raise: 20 },
    'J7s': { fold: 30, call: 55, raise: 15 },
    'J6s': { fold: 40, call: 50, raise: 10 },
    'JTo': { fold: 10, call: 60, raise: 30 },
    'J9o': { fold: 25, call: 60, raise: 15 },
    'J8o': { fold: 45, call: 45, raise: 10 },
    'T9s': { fold: 0, call: 55, raise: 45 },
    'T8s': { fold: 10, call: 65, raise: 25 },
    'T7s': { fold: 25, call: 60, raise: 15 },
    'T9o': { fold: 20, call: 60, raise: 20 },
    '98s': { fold: 5, call: 60, raise: 35 },
    '97s': { fold: 15, call: 65, raise: 20 },
    '96s': { fold: 30, call: 55, raise: 15 },
    '98o': { fold: 30, call: 55, raise: 15 },
    '87s': { fold: 10, call: 60, raise: 30 },
    '86s': { fold: 20, call: 60, raise: 20 },
    '87o': { fold: 40, call: 50, raise: 10 },
    '76s': { fold: 15, call: 60, raise: 25 },
    '75s': { fold: 30, call: 55, raise: 15 },
    '65s': { fold: 20, call: 60, raise: 20 },
    '64s': { fold: 35, call: 50, raise: 15 },
    '54s': { fold: 25, call: 55, raise: 20 },
    '53s': { fold: 40, call: 45, raise: 15 },
    '43s': { fold: 45, call: 45, raise: 10 },
  },

  // BBがBTNのオープンに対して
  BB_vs_BTN: {
    'AA': { fold: 0, call: 0, raise: 100 },
    'KK': { fold: 0, call: 0, raise: 100 },
    'QQ': { fold: 0, call: 10, raise: 90 },
    'JJ': { fold: 0, call: 20, raise: 80 },
    'TT': { fold: 0, call: 40, raise: 60 },
    '99': { fold: 0, call: 60, raise: 40 },
    '88': { fold: 0, call: 70, raise: 30 },
    '77': { fold: 5, call: 75, raise: 20 },
    '66': { fold: 15, call: 70, raise: 15 },
    '55': { fold: 25, call: 65, raise: 10 },
    '44': { fold: 35, call: 55, raise: 10 },
    '33': { fold: 45, call: 50, raise: 5 },
    '22': { fold: 55, call: 40, raise: 5 },
    'AKs': { fold: 0, call: 0, raise: 100 },
    'AQs': { fold: 0, call: 15, raise: 85 },
    'AJs': { fold: 0, call: 35, raise: 65 },
    'ATs': { fold: 0, call: 50, raise: 50 },
    'A9s': { fold: 5, call: 60, raise: 35 },
    'A8s': { fold: 10, call: 60, raise: 30 },
    'A7s': { fold: 15, call: 60, raise: 25 },
    'A6s': { fold: 20, call: 60, raise: 20 },
    'A5s': { fold: 10, call: 55, raise: 35 },
    'A4s': { fold: 15, call: 55, raise: 30 },
    'A3s': { fold: 20, call: 55, raise: 25 },
    'A2s': { fold: 25, call: 55, raise: 20 },
    'AKo': { fold: 0, call: 5, raise: 95 },
    'AQo': { fold: 0, call: 30, raise: 70 },
    'AJo': { fold: 5, call: 50, raise: 45 },
    'ATo': { fold: 15, call: 55, raise: 30 },
    'A9o': { fold: 30, call: 55, raise: 15 },
    'A8o': { fold: 40, call: 50, raise: 10 },
    'A7o': { fold: 50, call: 45, raise: 5 },
    'KQs': { fold: 0, call: 30, raise: 70 },
    'KJs': { fold: 5, call: 45, raise: 50 },
    'KTs': { fold: 10, call: 55, raise: 35 },
    'K9s': { fold: 20, call: 60, raise: 20 },
    'K8s': { fold: 35, call: 55, raise: 10 },
    'K7s': { fold: 45, call: 50, raise: 5 },
    'KQo': { fold: 5, call: 45, raise: 50 },
    'KJo': { fold: 15, call: 55, raise: 30 },
    'KTo': { fold: 30, call: 55, raise: 15 },
    'K9o': { fold: 50, call: 45, raise: 5 },
    'QJs': { fold: 5, call: 50, raise: 45 },
    'QTs': { fold: 15, call: 55, raise: 30 },
    'Q9s': { fold: 30, call: 55, raise: 15 },
    'Q8s': { fold: 45, call: 45, raise: 10 },
    'QJo': { fold: 20, call: 55, raise: 25 },
    'QTo': { fold: 35, call: 55, raise: 10 },
    'JTs': { fold: 10, call: 55, raise: 35 },
    'J9s': { fold: 25, call: 55, raise: 20 },
    'J8s': { fold: 40, call: 50, raise: 10 },
    'JTo': { fold: 30, call: 55, raise: 15 },
    'T9s': { fold: 15, call: 55, raise: 30 },
    'T8s': { fold: 30, call: 55, raise: 15 },
    '98s': { fold: 20, call: 55, raise: 25 },
    '97s': { fold: 35, call: 50, raise: 15 },
    '87s': { fold: 25, call: 55, raise: 20 },
    '76s': { fold: 30, call: 55, raise: 15 },
    '65s': { fold: 35, call: 50, raise: 15 },
    '54s': { fold: 40, call: 50, raise: 10 },
  },

  // BBがCOのオープンに対して
  BB_vs_CO: {
    'AA': { fold: 0, call: 0, raise: 100 },
    'KK': { fold: 0, call: 0, raise: 100 },
    'QQ': { fold: 0, call: 5, raise: 95 },
    'JJ': { fold: 0, call: 15, raise: 85 },
    'TT': { fold: 0, call: 35, raise: 65 },
    '99': { fold: 5, call: 55, raise: 40 },
    '88': { fold: 10, call: 65, raise: 25 },
    '77': { fold: 20, call: 65, raise: 15 },
    '66': { fold: 30, call: 60, raise: 10 },
    '55': { fold: 40, call: 55, raise: 5 },
    '44': { fold: 55, call: 40, raise: 5 },
    '33': { fold: 65, call: 30, raise: 5 },
    '22': { fold: 75, call: 20, raise: 5 },
    'AKs': { fold: 0, call: 0, raise: 100 },
    'AQs': { fold: 0, call: 10, raise: 90 },
    'AJs': { fold: 0, call: 30, raise: 70 },
    'ATs': { fold: 5, call: 45, raise: 50 },
    'A9s': { fold: 15, call: 55, raise: 30 },
    'A8s': { fold: 25, call: 55, raise: 20 },
    'A7s': { fold: 30, call: 55, raise: 15 },
    'A6s': { fold: 35, call: 50, raise: 15 },
    'A5s': { fold: 25, call: 50, raise: 25 },
    'A4s': { fold: 30, call: 50, raise: 20 },
    'A3s': { fold: 40, call: 45, raise: 15 },
    'A2s': { fold: 45, call: 45, raise: 10 },
    'AKo': { fold: 0, call: 0, raise: 100 },
    'AQo': { fold: 0, call: 25, raise: 75 },
    'AJo': { fold: 10, call: 50, raise: 40 },
    'ATo': { fold: 25, call: 55, raise: 20 },
    'A9o': { fold: 45, call: 45, raise: 10 },
    'A8o': { fold: 55, call: 40, raise: 5 },
    'KQs': { fold: 0, call: 25, raise: 75 },
    'KJs': { fold: 10, call: 45, raise: 45 },
    'KTs': { fold: 20, call: 55, raise: 25 },
    'K9s': { fold: 35, call: 55, raise: 10 },
    'K8s': { fold: 50, call: 45, raise: 5 },
    'KQo': { fold: 10, call: 45, raise: 45 },
    'KJo': { fold: 25, call: 55, raise: 20 },
    'KTo': { fold: 40, call: 50, raise: 10 },
    'QJs': { fold: 15, call: 50, raise: 35 },
    'QTs': { fold: 25, call: 55, raise: 20 },
    'Q9s': { fold: 45, call: 45, raise: 10 },
    'QJo': { fold: 30, call: 55, raise: 15 },
    'QTo': { fold: 50, call: 45, raise: 5 },
    'JTs': { fold: 20, call: 55, raise: 25 },
    'J9s': { fold: 40, call: 50, raise: 10 },
    'JTo': { fold: 45, call: 50, raise: 5 },
    'T9s': { fold: 30, call: 55, raise: 15 },
    'T8s': { fold: 50, call: 45, raise: 5 },
    '98s': { fold: 35, call: 55, raise: 10 },
    '87s': { fold: 40, call: 50, raise: 10 },
    '76s': { fold: 45, call: 45, raise: 10 },
    '65s': { fold: 50, call: 45, raise: 5 },
  },

  // BBがHJのオープンに対して
  BB_vs_HJ: {
    'AA': { fold: 0, call: 0, raise: 100 },
    'KK': { fold: 0, call: 0, raise: 100 },
    'QQ': { fold: 0, call: 0, raise: 100 },
    'JJ': { fold: 0, call: 10, raise: 90 },
    'TT': { fold: 0, call: 30, raise: 70 },
    '99': { fold: 10, call: 50, raise: 40 },
    '88': { fold: 20, call: 60, raise: 20 },
    '77': { fold: 35, call: 55, raise: 10 },
    '66': { fold: 50, call: 45, raise: 5 },
    '55': { fold: 65, call: 30, raise: 5 },
    '44': { fold: 80, call: 15, raise: 5 },
    '33': { fold: 90, call: 10, raise: 0 },
    '22': { fold: 95, call: 5, raise: 0 },
    'AKs': { fold: 0, call: 0, raise: 100 },
    'AQs': { fold: 0, call: 5, raise: 95 },
    'AJs': { fold: 0, call: 25, raise: 75 },
    'ATs': { fold: 10, call: 40, raise: 50 },
    'A9s': { fold: 30, call: 45, raise: 25 },
    'A8s': { fold: 40, call: 45, raise: 15 },
    'A7s': { fold: 50, call: 40, raise: 10 },
    'A6s': { fold: 55, call: 35, raise: 10 },
    'A5s': { fold: 40, call: 40, raise: 20 },
    'A4s': { fold: 50, call: 35, raise: 15 },
    'A3s': { fold: 60, call: 30, raise: 10 },
    'A2s': { fold: 70, call: 25, raise: 5 },
    'AKo': { fold: 0, call: 0, raise: 100 },
    'AQo': { fold: 5, call: 20, raise: 75 },
    'AJo': { fold: 20, call: 45, raise: 35 },
    'ATo': { fold: 40, call: 45, raise: 15 },
    'A9o': { fold: 65, call: 30, raise: 5 },
    'KQs': { fold: 5, call: 20, raise: 75 },
    'KJs': { fold: 15, call: 40, raise: 45 },
    'KTs': { fold: 30, call: 50, raise: 20 },
    'K9s': { fold: 50, call: 45, raise: 5 },
    'KQo': { fold: 15, call: 40, raise: 45 },
    'KJo': { fold: 35, call: 50, raise: 15 },
    'KTo': { fold: 55, call: 40, raise: 5 },
    'QJs': { fold: 25, call: 45, raise: 30 },
    'QTs': { fold: 35, call: 50, raise: 15 },
    'Q9s': { fold: 60, call: 35, raise: 5 },
    'QJo': { fold: 45, call: 45, raise: 10 },
    'JTs': { fold: 30, call: 50, raise: 20 },
    'J9s': { fold: 55, call: 40, raise: 5 },
    'JTo': { fold: 55, call: 40, raise: 5 },
    'T9s': { fold: 45, call: 45, raise: 10 },
    '98s': { fold: 50, call: 45, raise: 5 },
    '87s': { fold: 55, call: 40, raise: 5 },
    '76s': { fold: 60, call: 35, raise: 5 },
  },

  // BBがUTGのオープンに対して
  BB_vs_UTG: {
    'AA': { fold: 0, call: 0, raise: 100 },
    'KK': { fold: 0, call: 0, raise: 100 },
    'QQ': { fold: 0, call: 0, raise: 100 },
    'JJ': { fold: 0, call: 5, raise: 95 },
    'TT': { fold: 5, call: 25, raise: 70 },
    '99': { fold: 20, call: 45, raise: 35 },
    '88': { fold: 35, call: 50, raise: 15 },
    '77': { fold: 55, call: 40, raise: 5 },
    '66': { fold: 70, call: 25, raise: 5 },
    '55': { fold: 85, call: 10, raise: 5 },
    '44': { fold: 95, call: 5, raise: 0 },
    '33': { fold: 100, call: 0, raise: 0 },
    '22': { fold: 100, call: 0, raise: 0 },
    'AKs': { fold: 0, call: 0, raise: 100 },
    'AQs': { fold: 0, call: 0, raise: 100 },
    'AJs': { fold: 5, call: 20, raise: 75 },
    'ATs': { fold: 20, call: 35, raise: 45 },
    'A9s': { fold: 50, call: 35, raise: 15 },
    'A8s': { fold: 65, call: 30, raise: 5 },
    'A7s': { fold: 75, call: 20, raise: 5 },
    'A6s': { fold: 80, call: 15, raise: 5 },
    'A5s': { fold: 60, call: 30, raise: 10 },
    'A4s': { fold: 70, call: 25, raise: 5 },
    'A3s': { fold: 80, call: 15, raise: 5 },
    'A2s': { fold: 90, call: 10, raise: 0 },
    'AKo': { fold: 0, call: 0, raise: 100 },
    'AQo': { fold: 5, call: 15, raise: 80 },
    'AJo': { fold: 35, call: 40, raise: 25 },
    'ATo': { fold: 60, call: 35, raise: 5 },
    'A9o': { fold: 85, call: 15, raise: 0 },
    'KQs': { fold: 10, call: 15, raise: 75 },
    'KJs': { fold: 25, call: 35, raise: 40 },
    'KTs': { fold: 45, call: 40, raise: 15 },
    'K9s': { fold: 70, call: 25, raise: 5 },
    'KQo': { fold: 25, call: 35, raise: 40 },
    'KJo': { fold: 50, call: 40, raise: 10 },
    'KTo': { fold: 75, call: 20, raise: 5 },
    'QJs': { fold: 35, call: 40, raise: 25 },
    'QTs': { fold: 50, call: 40, raise: 10 },
    'Q9s': { fold: 75, call: 20, raise: 5 },
    'QJo': { fold: 60, call: 35, raise: 5 },
    'JTs': { fold: 45, call: 45, raise: 10 },
    'J9s': { fold: 70, call: 25, raise: 5 },
    'T9s': { fold: 60, call: 35, raise: 5 },
    '98s': { fold: 65, call: 30, raise: 5 },
    '87s': { fold: 70, call: 25, raise: 5 },
    '76s': { fold: 75, call: 20, raise: 5 },
  },

  // SBがBTNのオープンに対して
  SB_vs_BTN: {
    'AA': { fold: 0, call: 0, raise: 100 },
    'KK': { fold: 0, call: 0, raise: 100 },
    'QQ': { fold: 0, call: 0, raise: 100 },
    'JJ': { fold: 0, call: 10, raise: 90 },
    'TT': { fold: 0, call: 25, raise: 75 },
    '99': { fold: 0, call: 40, raise: 60 },
    '88': { fold: 5, call: 55, raise: 40 },
    '77': { fold: 15, call: 60, raise: 25 },
    '66': { fold: 30, call: 55, raise: 15 },
    '55': { fold: 45, call: 45, raise: 10 },
    '44': { fold: 60, call: 35, raise: 5 },
    '33': { fold: 75, call: 20, raise: 5 },
    '22': { fold: 85, call: 10, raise: 5 },
    'AKs': { fold: 0, call: 0, raise: 100 },
    'AQs': { fold: 0, call: 5, raise: 95 },
    'AJs': { fold: 0, call: 20, raise: 80 },
    'ATs': { fold: 0, call: 35, raise: 65 },
    'A9s': { fold: 10, call: 50, raise: 40 },
    'A8s': { fold: 20, call: 50, raise: 30 },
    'A7s': { fold: 30, call: 50, raise: 20 },
    'A6s': { fold: 35, call: 45, raise: 20 },
    'A5s': { fold: 20, call: 45, raise: 35 },
    'A4s': { fold: 30, call: 45, raise: 25 },
    'A3s': { fold: 40, call: 40, raise: 20 },
    'A2s': { fold: 50, call: 35, raise: 15 },
    'AKo': { fold: 0, call: 0, raise: 100 },
    'AQo': { fold: 0, call: 15, raise: 85 },
    'AJo': { fold: 10, call: 40, raise: 50 },
    'ATo': { fold: 25, call: 50, raise: 25 },
    'A9o': { fold: 50, call: 40, raise: 10 },
    'A8o': { fold: 65, call: 30, raise: 5 },
    'KQs': { fold: 0, call: 15, raise: 85 },
    'KJs': { fold: 10, call: 35, raise: 55 },
    'KTs': { fold: 20, call: 45, raise: 35 },
    'K9s': { fold: 40, call: 45, raise: 15 },
    'K8s': { fold: 55, call: 35, raise: 10 },
    'KQo': { fold: 10, call: 35, raise: 55 },
    'KJo': { fold: 25, call: 50, raise: 25 },
    'KTo': { fold: 45, call: 45, raise: 10 },
    'QJs': { fold: 15, call: 40, raise: 45 },
    'QTs': { fold: 25, call: 50, raise: 25 },
    'Q9s': { fold: 45, call: 45, raise: 10 },
    'QJo': { fold: 30, call: 50, raise: 20 },
    'QTo': { fold: 50, call: 40, raise: 10 },
    'JTs': { fold: 20, call: 50, raise: 30 },
    'J9s': { fold: 40, call: 50, raise: 10 },
    'JTo': { fold: 45, call: 45, raise: 10 },
    'T9s': { fold: 30, call: 55, raise: 15 },
    'T8s': { fold: 50, call: 40, raise: 10 },
    '98s': { fold: 40, call: 50, raise: 10 },
    '87s': { fold: 45, call: 45, raise: 10 },
    '76s': { fold: 50, call: 40, raise: 10 },
    '65s': { fold: 55, call: 35, raise: 10 },
  }
};

// デフォルトレンジ（データにないハンドはフォールド）
const DEFAULT_RANGE = { fold: 100, call: 0, raise: 0 };

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

// BTNの席インデックスからプレイヤーのポジションを計算
function getPositionForSeat(seatIndex, btnSeatIndex) {
  const relativePosition = (seatIndex - btnSeatIndex + 6) % 6;
  return POSITIONS[relativePosition];
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

function createGame(handNumber = 1, btnSeatIndex = 0, heroSeatIndex = null) {
  const deck = createDeck();

  // ヒーローの席（指定なければランダム）
  if (heroSeatIndex === null) {
    heroSeatIndex = Math.floor(Math.random() * 6);
  }

  const players = SEAT_ORDER.map((seatIndex) => {
    const holeCards = [deck.pop(), deck.pop()];
    const position = getPositionForSeat(seatIndex, btnSeatIndex);
    return {
      id: `player-${seatIndex}`,
      seatIndex: seatIndex,
      name: seatIndex === heroSeatIndex ? 'Hero' : `Player ${seatIndex + 1}`,
      position: position,
      stack: 10000,
      holeCards: holeCards,
      isHero: seatIndex === heroSeatIndex,
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
    btnSeatIndex: btnSeatIndex,
    heroSeatIndex: heroSeatIndex,
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

// 次のハンドへ（BTNを右回り）
function nextHand() {
  const newBtnSeatIndex = (gameState.btnSeatIndex + 1) % 6;
  const newHandNumber = gameState.handNumber + 1;
  const heroSeatIndex = gameState.heroSeatIndex;

  return createGame(newHandNumber, newBtnSeatIndex, heroSeatIndex);
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

  const actions = rangeData[handNotation] || DEFAULT_RANGE;

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

  // 次のプレイヤーへ
  gameState.currentPlayerIndex = getNextPlayerIndex(playerIndex, gameState.players);

  // ハンド終了チェック
  if (countActivePlayers(gameState) <= 1) {
    gameState.isHandComplete = true;
  }

  return {
    ...action,
    game: gameState,
    remainingActions: gameState.pendingAIActions.length
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
// GTO推奨（ハードコードデータから）
// ============================================

function getGTORecommendation() {
  if (!gameState) return null;

  const hero = gameState.players.find(p => p.isHero);
  if (!hero) return null;

  const handNotation = getHandNotation(hero.holeCards);
  const position = hero.position;
  const hasRaise = gameState.currentBet > gameState.blinds.bb;
  const openerPosition = gameState.firstRaiserPosition;
  const bb = gameState.blinds.bb;

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
  }

  const actions = rangeData[handNotation] || DEFAULT_RANGE;

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

  if (actions.raise > 0) {
    if (situation === 'RFI') {
      raise_size_description = '2.5BB';
      raise_reasoning = '標準的なオープンサイズです。';
    } else {
      const openerAmount = gameState.firstRaiserAmount || bb * 2.5;
      const threeBetSize = Math.round(openerAmount * 3);
      raise_size_description = `${(threeBetSize / bb).toFixed(1)}BB (3x)`;
      raise_reasoning = `${openerPosition}のオープンに対する標準的な3betサイズです。`;
    }
  }

  return {
    fold_percentage: actions.fold,
    call_percentage: actions.call,
    raise_percentage: actions.raise,
    raise_size_description,
    raise_reasoning,
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

  res.writeHead(404);
  res.end('Not found');
});

server.listen(3001, () => {
  console.log('🃏 GTO Poker Server v3 (Preflop Only) running on http://localhost:3001');
});
