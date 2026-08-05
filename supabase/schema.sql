-- MLB Predictor 資料庫 Schema
-- 在 Supabase SQL Editor 執行此檔案

-- 1. 訂閱紀錄表
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type               text NOT NULL CHECK (plan_type IN ('monthly', 'day_pass')),
  status                  text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  expires_at              timestamptz NOT NULL,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

-- 每個用戶只保留一筆有效訂閱（依 user_id + plan_type 唯一）
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_plan_idx
  ON subscriptions (user_id, plan_type);

-- 2. RLS（Row Level Security）
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 用戶只能查看自己的訂閱
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 只有 service role 可以新增/修改（Webhook 使用）
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- 3. Supabase Storage — picks bucket（私有）
-- 在 Supabase Dashboard > Storage 手動建立 bucket 名稱 "picks"，設為 Private
-- 或執行以下 SQL（需要 Storage 權限）：
-- INSERT INTO storage.buckets (id, name, public) VALUES ('picks', 'picks', false);

-- 4. updated_at 自動更新 trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
