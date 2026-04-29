# Cyber Attack Visualization (pewpew-map)

サイバー攻撃の代表的な手口を、ピクトグラムを用いた**動きつきアニメーション**で可視化するWebアプリケーションです。
攻撃の挙動だけでなく、**実際の被害事例**・**対策方法**・**アプリケーション開発時の注意ポイント**を1ページにまとめ、開発者・教育・セキュリティ啓発向けの教材として使えるよう設計しています。

参照分類: [サイバー攻撃の種類 - 攻撃遮断くん](https://www.shadan-kun.com/waf_websecurity/cyber_attack_type/)

---

## 技術スタック

| レイヤ | 採用技術 |
| --- | --- |
| 言語 | **TypeScript** (strict) |
| UI | **React 18** + React Router |
| ビルド | Vite |
| スタイル | プレーンCSS (CSS変数によるテーマ) |
| アイコン | JIS Z 8210 風のオリジナルSVGコンポーネント |
| アニメーション | 自作 `Stage` クラス + 宣言的 `runSequence` ヘルパ |

---

## 特徴

- **攻撃ごとに独立したファイル**: `src/attacks/<slug>.ts` 1ファイル = 1攻撃。シナリオ・解説・アクター配置を1か所で管理
- **メタデータ駆動**: `src/data/attacks.ts` のメタ情報からトップカタログとルーティングを自動生成
- **ルーティング**: `/#/attacks/<slug>` 形式(HashRouter)で静的ホスティング可能
- **再利用可能なアニメーション基盤**: `Stage` クラスでアクター追加・パケット飛行・揺らし・状態遷移を宣言的に組める
- **型安全**: `AttackDefinition`, `AttackMeta`, `PictogramName` など主要I/Fを型定義
- **ブランチ駆動開発**: 攻撃手法ごとに専用ブランチで実装し、レビュー粒度を保ちつつ並列開発

---

## ディレクトリ構成

```
pewpew-map/
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx                  # エントリ
    ├── App.tsx                   # ルータ定義
    ├── types.ts                  # AttackDefinition / Meta / Pictogram 等の型
    ├── styles/main.css
    ├── data/
    │   └── attacks.ts            # 攻撃メタデータ + カテゴリ
    ├── lib/
    │   ├── Stage.ts              # アニメーション基盤
    │   └── pictograms.tsx        # SVGピクトグラム
    ├── components/
    │   ├── SiteHeader.tsx
    │   ├── HomePage.tsx          # カタログ
    │   ├── AttackPage.tsx        # 個別攻撃ページの汎用ビュー
    │   ├── StageView.tsx         # Stage の React ラッパ
    │   └── InfoSection.tsx       # 被害/対策/開発注意の3カード
    └── attacks/
        ├── index.ts              # 全攻撃を集約 (attackRegistry)
        ├── sql-injection.ts
        ├── xss.ts
        ├── csrf.ts
        ├── os-command-injection.ts
        ├── directory-traversal.ts
        ├── session-hijacking.ts
        ├── ddos.ts
        ├── phishing.ts
        ├── clickjacking.ts
        └── ransomware.ts
```

各攻撃ファイルは `AttackDefinition` を1つ default相当でexportし、`attacks/index.ts` の `attackRegistry` に登録される。トップページの一覧表示・個別ページのレンダリングはこのレジストリ駆動で行われる。

---

## 取り扱う攻撃分類

| 分類 | 攻撃手法 |
| --- | --- |
| Webアプリケーションへの攻撃 | SQLインジェクション / XSS / CSRF / OSコマンドインジェクション / ディレクトリトラバーサル / セッションハイジャック |
| 不特定多数を狙う攻撃 | DDoS / フィッシング / クリックジャッキング / ドライブバイダウンロード |
| 特定組織を狙う攻撃 | 標的型攻撃(APT) / 水飲み場型攻撃 / サプライチェーン攻撃 / ランサムウェア |
| 認証情報を狙う攻撃 | ブルートフォース / パスワードリスト攻撃 |

各攻撃ページに以下を掲載:
1. 仕組み(アニメーション)
2. 代表的な被害事例
3. 対策方法
4. アプリケーション開発上の注意ポイント

---

## セットアップ

```bash
npm install
npm run dev      # http://localhost:5173 で起動
npm run build    # 本番ビルド (./dist)
npm run preview  # ビルド成果物のプレビュー
npm run typecheck
```

---

## アニメーションの操作

各攻撃ページのアニメーションは **ステップ実行型** です。

- **▶ 開始 / 次へ ▶**: 1フェーズずつ進行(全フェーズで `現在のフェーズ`/`説明文` が表示)
- **リセット**: アクター配置からやり直し、ステップを0に戻す
- ステップ進行は `ステップ N / 全数` で確認可能

各攻撃の `setup()` でアクターを配置し、`steps[]` で1フェーズごとのアニメーションを宣言します。これにより、全フェーズが理解できるよう自分のペースで読み進められます。

---

## 新しい攻撃を追加する手順

1. 統合ブランチから `git switch -c feature/attack-<slug>` で派生
2. `src/data/attacks.ts` の `AttacksMeta` に1エントリ追加(`implemented: true` を忘れずに)
3. `src/attacks/<slug>.ts` を作成し `AttackDefinition` をexport
4. `src/attacks/index.ts` の `all` 配列にimport/追加
5. `npm run typecheck && npm run build` で型・ビルド確認
6. 統合ブランチへマージ

---

## 開発フロー(ブランチ運用)

```
claude/cyber-attack-visualization-ZqdAs   ← 統合開発ブランチ(基盤・レジストリ)
  ├─ feature/attack-sql-injection         ← 各攻撃手法は専用ブランチ
  ├─ feature/attack-xss
  ├─ ...
  └─ feature/migrate-to-react-ts          ← 大規模リファクタは別ブランチ
```

---

## ライセンス / 留意事項

- 本リポジトリは**教育・啓発目的**です。掲載するコード片や攻撃シナリオは脆弱性の理解を促す概要表現にとどめ、実攻撃の手順書は含みません
- ピクトグラムはJIS Z 8210風のオリジナルSVGで、外部画像アセットへの依存はありません
