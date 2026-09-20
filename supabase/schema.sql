-- そろそろリマインダー：テーブル作成
-- Supabase の画面左メニュー「SQL Editor」に貼り付けて実行してください。

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,                 -- 品目名（例：トイレットペーパー）
  cycle_days int not null,            -- 標準周期（日数）
  place text,                         -- 購入先（MVPでは保存のみ）
  last_purchased_at date not null,    -- 最後に買った日
  created_at timestamptz not null default now()
);

-- 行レベルセキュリティを有効にする。
-- ポリシーを作らないため、公開キー（anon）からは一切読み書きできない。
-- アプリはサーバー側から秘密キー（service_role）で読み書きする。
alter table public.items enable row level security;
