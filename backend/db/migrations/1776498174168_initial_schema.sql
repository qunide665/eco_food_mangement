-- Initial schema migration for 消费餐饮助手

CREATE TABLE IF NOT EXISTS "Users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "Budgets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "month" TEXT NOT NULL,
  "total_budget" NUMERIC(10, 2) NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE("user_id", "month")
);

CREATE TABLE IF NOT EXISTS "Dishes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES "Users"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "price" NUMERIC(10, 2) NOT NULL,
  "category" TEXT NOT NULL,
  "image_url" TEXT,
  "is_default" BOOLEAN DEFAULT FALSE NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "Expenses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "dish_id" UUID REFERENCES "Dishes"("id") ON DELETE SET NULL,
  "name" TEXT NOT NULL,
  "amount" NUMERIC(10, 2) NOT NULL,
  "meal_type" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "Recommendations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "date" TEXT NOT NULL,
  "breakfast_dish_id" UUID REFERENCES "Dishes"("id") ON DELETE SET NULL,
  "lunch_dish_id" UUID REFERENCES "Dishes"("id") ON DELETE SET NULL,
  "dinner_dish_id" UUID REFERENCES "Dishes"("id") ON DELETE SET NULL,
  "breakfast_confirmed" BOOLEAN DEFAULT FALSE NOT NULL,
  "lunch_confirmed" BOOLEAN DEFAULT FALSE NOT NULL,
  "dinner_confirmed" BOOLEAN DEFAULT FALSE NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE("user_id", "date")
);

-- Seed default dishes
INSERT INTO "Dishes" ("name", "price", "category", "image_url", "is_default") VALUES
  ('全麦吐司+煎蛋', 12.00, 'breakfast', 'https://images.unsplash.com/photo-1734771657497-e8a65edfc655?auto=format&fit=crop&w=400&q=80', TRUE),
  ('豆浆油条', 8.00, 'breakfast', 'https://images.unsplash.com/photo-1773915950207-2d485a8e2aa2?auto=format&fit=crop&w=400&q=80', TRUE),
  ('皮蛋瘦肉粥', 15.00, 'breakfast', 'https://images.unsplash.com/photo-1768482303667-7f27d75ed0cb?auto=format&fit=crop&w=400&q=80', TRUE),
  ('牛奶燕麦', 10.00, 'breakfast', 'https://images.unsplash.com/photo-1734771657497-e8a65edfc655?auto=format&fit=crop&w=400&q=80', TRUE),
  ('鸡胸肉藜麦沙拉', 35.00, 'lunch', 'https://images.unsplash.com/photo-1758721218560-aec50748d450?auto=format&fit=crop&w=400&q=80', TRUE),
  ('黄焖鸡米饭', 22.00, 'lunch', 'https://images.unsplash.com/photo-1775039983749-aa6003c8ecf9?auto=format&fit=crop&w=400&q=80', TRUE),
  ('麻辣烫', 25.00, 'lunch', 'https://images.unsplash.com/photo-1671497408253-1c996a4a1fdd?auto=format&fit=crop&w=400&q=80', TRUE),
  ('盖浇饭', 18.00, 'lunch', 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=400&q=80', TRUE),
  ('番茄牛腩面', 28.00, 'dinner', 'https://images.unsplash.com/photo-1643478224346-47bd9ed48e36?auto=format&fit=crop&w=400&q=80', TRUE),
  ('清蒸鱼+米饭', 45.00, 'dinner', 'https://images.unsplash.com/photo-1651330395670-1680a92028bc?auto=format&fit=crop&w=400&q=80', TRUE),
  ('砂锅粥', 20.00, 'dinner', 'https://images.unsplash.com/photo-1626509653291-5558b258f107?auto=format&fit=crop&w=400&q=80', TRUE),
  ('家常炒菜+米饭', 30.00, 'dinner', 'https://images.unsplash.com/photo-1775039983749-aa6003c8ecf9?auto=format&fit=crop&w=400&q=80', TRUE)
ON CONFLICT DO NOTHING;
