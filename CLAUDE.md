# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## このプロジェクトについて

「そろそろリマインダー」— 日用品（トイレットペーパー・洗剤・シャンプーなど）の買い忘れを防ぐWebアプリ。
**仕様の正は `requirements.md`**。機能の追加・変更の前に必ず読み、ここに書かれた範囲とPhaseに従う。

現状は create-next-app 直後の状態（`src/app/page.tsx` などは初期テンプレート）。実装はこれから。

## コマンド

```bash
npm run dev          # 開発サーバー（http://localhost:3000）
npm run build        # 本番ビルド（型エラーもここで検出される）
npm run lint         # ESLint（eslint-config-next の core-web-vitals + typescript）
npx tsc --noEmit     # 型チェックのみ
```

テストフレームワークは未導入。

## 技術構成

- Next.js 16（App Router）+ React 19 + TypeScript。**Next.js 16 は学習データと異なる破壊的変更がある**ため、コードを書く前に `node_modules/next/dist/docs/` の該当ガイドを読むこと（`AGENTS.md` 参照）
- Tailwind CSS v4（`@tailwindcss/postcss` 経由。`tailwind.config` ファイルは無く、設定は `src/app/globals.css` 側）
- import エイリアス: `@/*` → `src/*`
- 予定している外部サービス（`requirements.md` より）
  - Supabase（PostgreSQL）: 品目と購入日を保存。RLSを有効にする
  - LINE Messaging API（Push Message）: 「今買うもの」の通知先
  - Vercel Cron Jobs: 定時実行。Hobbyプランは実行頻度に制限があるため **毎日1回実行し、対象がある日だけ送信** する方式

## 全体の仕組み（requirements.md の設計）

```
[画面] 品目をプリセットから登録 → 「買った」を1タップ → 購入日を保存
                                      │
                           次回予定日 = 購入日 + 標準周期
                                      │
[Vercel Cron 1日1回] → 期日が来た品目を判定 → 対象があればLINEにPush
```

- 画面は **トップ（買うものリスト）と品目追加の2つだけ**。通知はLINE側で完結させ、アプリ内に通知画面は作らない
- プリセット品目ごとに標準周期（日数）を持たせ、**ユーザーに周期を入力させない**
- MVP は F-01〜F-05 のみ。F-06 以降（買う場所タグ・周期の自動学習など）は MVP 完成後

## 守るべき設計判断

`requirements.md` の「やらないこと」「最重要ポイント」に基づく。

- **在庫の個数管理をしない**。管理するのは「次にいつ買うか」だけ。入力を増やすと使われなくなり、通知が届かず課題が解決しないため
- 主要操作（買った記録）は **1タップで完了** させる
- 位置情報による「店に着いたら通知」は Web アプリでは実現不可のため採用しない。通知は定時方式
- 価格比較・レシート読取・家計簿・EC連携はスコープ外

## 環境変数（`.env.local`、Git管理外）

| 変数 | 用途 | 使える場所 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase の Project URL | ブラウザ・サーバー |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 公開キー（現在は旧形式の anon キーを設定） | ブラウザ・サーバー |
| `SUPABASE_SECRET_KEY` | 秘密キー（現在は旧形式の service_role キー） | **サーバーのみ** |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE チャネルアクセストークン（長期） | **サーバーのみ** |
| `LINE_USER_ID` | 通知の送信先（MVPは自分1人） | **サーバーのみ** |
| `CRON_SECRET` | Cron 用エンドポイントを外部から叩かれないための照合値 | **サーバーのみ** |

- `NEXT_PUBLIC_` が付かない変数は、クライアントコンポーネントから参照しないこと
- Supabase の URL とキーは **必ず同じプロジェクトのもの** を使う。アカウントにはプロジェクトが2つあり、別プロジェクトのキーを組み合わせると `401 Invalid API key` になる（新形式 `sb_` キーはどのプロジェクトのものか判別できないため、旧形式 JWT キーで `ref` を照合して特定した経緯がある）
- LINE の Push は送信先ユーザーがボットを友だち追加していないと届かない
