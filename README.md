# GTO Poker Trainer

テキサスホールデムポーカーの**GTO（Game Theory Optimal）戦略**を実戦形式で学べるWebアプリケーションです。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

---

## 目次

- [概要](#概要)
- [機能一覧](#機能一覧)
- [スクリーンショット](#スクリーンショット)
- [技術スタック](#技術スタック)
- [セットアップ](#セットアップ)
- [使い方](#使い方)
- [ファイル構成](#ファイル構成)
- [GTO戦略について](#gto戦略について)
- [今後の開発予定](#今後の開発予定)
- [ライセンス](#ライセンス)

---

## 概要

GTO Poker Trainerは、ポーカー初心者から中級者向けの学習ツールです。

- **6人テーブル**でAIプレイヤーと対戦
- リアルタイムで**GTO推奨アクション**を表示
- アクション後に**正誤フィードバック**（CORRECT / ERROR / ACCEPTABLE）
- **プリフロップレンジ表**で視覚的に学習

### なぜGTOを学ぶべきか？

GTO戦略は、相手がどんなプレイをしても長期的に負けない「ゲーム理論的に最適な戦略」です。これを基礎として身につけることで：

- 相手に搾取されにくくなる
- 状況に応じた正しい判断ができるようになる
- エクスプロイト（相手の弱点を突く）戦略への応用が可能になる

---

## 機能一覧

### コア機能

| 機能 | 説明 |
|------|------|
| 6人テーブル対戦 | BTN, SB, BB, UTG, HJ, CO の6ポジションでプレイ |
| AIプレイヤー | GTO的なロジックでアクションを決定 |
| 順次アクション表示 | AIのアクションが0.4秒間隔で順番に表示 |
| プリフロップ対応 | 現在はプリフロップのみ対応 |

### GTO学習機能

| 機能 | 説明 |
|------|------|
| リアルタイムGTO推奨 | Fold / Call / Raise のパーセンテージを表示 |
| 状況分析 | 前のアクション、ポジション、ポットオッズを考慮した分析 |
| 推奨理由 | なぜそのアクションが推奨されるかの詳細説明 |
| レイズサイズ提案 | 最適なベットサイズとその根拠 |

### レンジ表示機能

| 機能 | 説明 |
|------|------|
| 動的レンジ表示 | 状況に応じたレンジを自動切替 |
| オープンレンジ (RFI) | 全員フォールド時のオープンレンジ |
| 3bet / コールレンジ | オープンがあった場合のディフェンスレンジ |
| ハンドハイライト | 現在のハンドがレンジ表上で点滅 |
| レンジ内外判定 | 「✓ レンジ内」「✗ レンジ外」を明示 |

### フィードバック機能

| 結果 | 条件 |
|------|------|
| ✅ CORRECT | GTO推奨の最適アクションを選択 |
| ⚠️ ACCEPTABLE | 混合戦略として20%以上推奨されるアクションを選択 |
| ❌ ERROR | GTO推奨から外れたアクションを選択 |

### UI機能

| 機能 | 説明 |
|------|------|
| 3カラムレイアウト | 左:レンジ表、中央:テーブル、右:GTO推奨 |
| パネルトグル | レンジ表とGTO推奨パネルの表示/非表示切替 |
| レスポンシブ対応 | パネルを閉じるとメインエリアが広がる |
| アクションラベル | プレイヤーの上にアクション内容を表示 |

---

## スクリーンショット

### メイン画面（3カラムレイアウト）
```
┌─────────────────────────────────────────────────────────────────────┐
│  🃏 GTO Poker Trainer   SB/BB: 50/100   [📊 レンジ] [🎯 GTO]  [新しいハンド] │
├───────────────┬─────────────────────────────────┬───────────────────┤
│               │                                 │                   │
│   📊 レンジ    │       ┌───────────────┐        │    🎯 GTO推奨     │
│               │       │   Pot: 400    │        │                   │
│  UTG オープン  │       │   [  ][  ][  ][  ][  ] │    AA             │
│  レンジ (RFI) │       │   PREFLOP     │        │ ████████████████  │
│               │       └───────────────┘        │  Raise 100%       │
│  [AA][AK][AQ] │                                 │                   │
│  [AK][KK][KQ] │      👤 Player 2 (BTN)         │  📊 状況分析:     │
│  [AQ][KQ][QQ] │                                 │  • UTGからオープン │
│  ...          │   👤        👤                  │  • 2.5BBレイズ    │
│               │                                 │                   │
│  現在: AA     │   👤        👤                  │  📝 推奨理由:     │
│  ✓ レンジ内   │                                 │  • プレミアムハンド│
│               │      [A♠] [A♥]                 │  • 100%レイズ     │
│               │      UTG あなた 9,700          │                   │
│               ├─────────────────────────────────┤                   │
│               │  [Fold] [Check] [Raise 300]    │  💰 レイズ: 3BB   │
│               │  [1/3] [2/3] [Pot] [All-in]    │                   │
└───────────────┴─────────────────────────────────┴───────────────────┘
```

### フィードバック画面
```
┌─────────────────────────────────────────┐
│                                         │
│              ✅ CORRECT                 │
│                                         │
│   あなたの選択: Raise 300               │
│   GTO推奨: Raise 100%                   │
│                                         │
│   素晴らしい！GTO推奨のraiseを          │
│   選択しました。                         │
│                                         │
│           [次のアクションへ]             │
│                                         │
└─────────────────────────────────────────┘
```

---

## 技術スタック

### フロントエンド
- **React 18** (CDN版 UMD)
- **Tailwind CSS** (CDN版)
- **Babel Standalone** (ブラウザ上でJSX変換)

### バックエンド
- **Node.js** (v18以上推奨)
- **HTTP Server** (標準ライブラリのみ)

### その他
- **ES Modules** (サーバー側)
- **単一HTMLファイル** (フロント側、ビルド不要)

---

## セットアップ

### 必要条件

- Node.js 18.0.0 以上
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/Hiroaki-Sato1117/GTO_trainer.git
cd GTO_trainer

# 依存関係をインストール（現在は不要）
# npm install

# サーバーを起動
node simple-server.js
```

### 起動

1. **APIサーバーを起動**
   ```bash
   node simple-server.js
   ```
   → `http://localhost:3001` でAPIサーバーが起動

2. **HTMLファイルを開く**
   - 任意のHTTPサーバーで `poker.html` を配信
   - 例: VS Code Live Server, Python http.server など
   ```bash
   # Pythonを使う場合
   python3 -m http.server 8082
   ```
   → `http://localhost:8082/poker.html` でアクセス

---

## 使い方

### 基本的な流れ

1. **ゲーム開始**
   - 「新しいハンド」ボタンをクリック
   - ランダムなポジションでハンドが配られる

2. **AIのアクションを観察**
   - 自分の番まで、AIプレイヤーのアクションが順番に表示される
   - 各アクションは0.4秒間隔で表示

3. **GTO推奨を確認**
   - 右パネルにFold/Call/Raiseのパーセンテージが表示
   - 状況分析と推奨理由を読んで学習

4. **アクションを選択**
   - フォールド / チェック（コール） / レイズ から選択
   - レイズサイズはスライダーまたは数値入力で調整

5. **フィードバックを確認**
   - アクション後にCORRECT/ERROR/ACCEPTABLEが表示
   - 自分のプレイがGTO的に正しかったか確認

### レンジ表の読み方

```
    A  K  Q  J  T  9  8  ...
A  [AA][AKs][AQs][AJs]...     ← 行: 1枚目のカード
K  [AKo][KK][KQs][KJs]...     ← 列: 2枚目のカード
Q  [AQo][KQo][QQ][QJs]...
...

- 対角線: ペア (AA, KK, QQ...)
- 対角線より上: スーテッド (AKs, AQs...)
- 対角線より下: オフスート (AKo, AQo...)

色の意味:
- 緑: オープン / コール
- オレンジ: 3bet / レイズ
- グレー: フォールド
```

### パネルの表示/非表示

ヘッダーの「📊 レンジ」「🎯 GTO」ボタンでパネルの表示/非表示を切り替えられます。

- 両方表示: 3カラムレイアウト
- 片方のみ: 2カラムレイアウト
- 両方非表示: テーブルのみの広いビュー

---

## ファイル構成

```
GTO_trainer/
├── poker.html          # フロントエンド（単一HTMLファイル）
├── simple-server.js    # バックエンドAPIサーバー
├── package.json        # プロジェクト設定
├── package-lock.json   # 依存関係ロック
├── .gitignore          # Git除外設定
├── .env                # 環境変数（Git管理外）
└── README.md           # このファイル
```

### poker.html

- React 18 + Tailwind CSS をCDNから読み込み
- Babel Standaloneでブラウザ上でJSXを変換
- 全てのUIコンポーネントを含む単一ファイル

**主要コンポーネント:**
| コンポーネント | 説明 |
|--------------|------|
| `App` | メインアプリケーション |
| `RangePanel` | 左パネル（レンジ表） |
| `GTOPanel` | 右パネル（GTO推奨） |
| `PlayerSeat` | テーブル上のプレイヤー |
| `Card` | トランプカード表示 |
| `FeedbackModal` | フィードバックモーダル |

### simple-server.js

- Node.js標準のHTTPサーバー
- CORSに対応
- ゲームロジックとGTO計算を含む

**主要エンドポイント:**
| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/health` | GET | ヘルスチェック |
| `/api/game/new` | POST | 新しいゲームを開始 |
| `/api/game/next-ai-action` | GET | 次のAIアクションを取得 |
| `/api/game/action` | POST | プレイヤーのアクションを実行 |
| `/api/game/gto-recommendation` | GET | GTO推奨を取得 |

**主要関数:**
| 関数 | 説明 |
|------|------|
| `createGame()` | ゲーム状態を初期化 |
| `decideAIAction()` | AIのアクションを決定 |
| `getGTORecommendation()` | GTO推奨を計算 |
| `calculatePendingAIActions()` | ヒーローの番までのAIアクションを事前計算 |

---

## GTO戦略について

### プリフロップ基本戦略

#### オープンレンジ (RFI: Raise First In)

全員がフォールドした時にオープンするハンドの範囲。

| ポジション | オープン率 | 例 |
|-----------|----------|-----|
| UTG | 15% | AA-77, AKs-ATs, KQs, AKo-AJo |
| HJ | 18% | AA-66, AKs-A9s, KQs-KTs, AKo-ATo |
| CO | 25% | AA-55, AKs-A7s, KQs-K9s, Axs, AKo-ATo |
| BTN | 40% | AA-22, Axs, Kxs, Qxs, 多くのスーコネ |
| SB | 35% | BTNより少し狭く |

#### 3betレンジ

オープンに対してリレイズするハンドの範囲。

| vs ポジション | 3bet率 | バリュー部分 | ブラフ部分 |
|-------------|--------|------------|----------|
| vs UTG | 4-5% | AA-QQ, AKs | A5s-A4s |
| vs CO | 8-10% | AA-TT, AKs-AJs | A5s-A2s, KQs |
| vs BTN | 10-12% | AA-99, AKs-ATs | 広めのブラフレンジ |

### ポットオッズと期待値

コールするかどうかの判断基準：

```
ポットオッズ = コール額 / (ポット + コール額)

例: ポット300、コール額100の場合
→ 100 / (300 + 100) = 25%
→ 25%以上の勝率があればコールは+EV
```

### ポジションの重要性

ポジションがあると：
- 相手の情報を先に得られる
- ポットコントロールしやすい
- ブラフが成功しやすい

**IP (In Position)**: ポジションがある = 後から行動する
**OOP (Out of Position)**: ポジションがない = 先に行動する

---

## 今後の開発予定

### 近日対応予定

- [ ] フロップ以降のストリート対応
- [ ] ポストフロップGTO推奨
- [ ] ハンド履歴の保存・閲覧
- [ ] 学習統計（正解率、よくあるミスなど）

### 将来的な機能

- [ ] Gemini API連携（より高度なGTO分析）
- [ ] マルチテーブル対応
- [ ] トーナメントモード
- [ ] カスタムレンジ設定
- [ ] モバイル対応

---

## ライセンス

MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 貢献

バグ報告や機能リクエストは [Issues](https://github.com/Hiroaki-Sato1117/GTO_trainer/issues) からお願いします。

プルリクエストも歓迎です！

---

## 作者

- GitHub: [@Hiroaki-Sato1117](https://github.com/Hiroaki-Sato1117)

---

## 謝辞

- ポーカー戦略の参考: 各種GTO solver、ポーカー戦略書籍
- アイコン: 絵文字を使用
