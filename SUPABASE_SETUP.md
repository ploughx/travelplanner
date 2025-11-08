# Supabase 数据库设置指南

## 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com/)
2. 创建新项目
3. 记录项目的 URL 和 anon key

## 2. 数据库表结构

在 Supabase SQL 编辑器中执行以下 SQL 语句来创建必要的表：

### 用户档案表 (profiles)

```sql
-- 创建用户档案表
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- 启用行级安全策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能查看和修改自己的档案
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

### 旅行计划表 (travel_plans)

```sql
-- 创建旅行计划表
CREATE TABLE travel_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  duration INTEGER NOT NULL,
  budget_type TEXT NOT NULL,
  budget_total INTEGER NOT NULL,
  travel_style TEXT NOT NULL,
  interests TEXT[] NOT NULL DEFAULT '{}',
  start_date DATE,
  travelers INTEGER,
  itinerary JSONB,
  recommendations JSONB,
  budget_breakdown JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 启用行级安全策略
ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的旅行计划
CREATE POLICY "Users can view own travel plans" ON travel_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own travel plans" ON travel_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own travel plans" ON travel_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own travel plans" ON travel_plans FOR DELETE USING (auth.uid() = user_id);

-- 创建索引
CREATE INDEX travel_plans_user_id_idx ON travel_plans(user_id);
CREATE INDEX travel_plans_created_at_idx ON travel_plans(created_at DESC);
```

### 费用记录表 (expenses)

```sql
-- 创建费用记录表
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  travel_plan_id UUID REFERENCES travel_plans(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 启用行级安全策略
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的费用记录
CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

-- 创建索引
CREATE INDEX expenses_user_id_idx ON expenses(user_id);
CREATE INDEX expenses_travel_plan_id_idx ON expenses(travel_plan_id);
CREATE INDEX expenses_date_idx ON expenses(date DESC);
```

### 用户偏好表 (user_preferences)

```sql
-- 创建用户偏好表
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_destinations TEXT[] DEFAULT '{}',
  preferred_travel_styles TEXT[] DEFAULT '{}',
  preferred_interests TEXT[] DEFAULT '{}',
  default_budget_type TEXT,
  default_travelers INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 启用行级安全策略
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的偏好设置
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own preferences" ON user_preferences FOR DELETE USING (auth.uid() = user_id);

-- 创建索引
CREATE INDEX user_preferences_user_id_idx ON user_preferences(user_id);
```

## 3. 触发器设置

### 自动更新 updated_at 字段

```sql
-- 创建更新时间戳的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表创建触发器
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_travel_plans_updated_at BEFORE UPDATE ON travel_plans FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

### 自动创建用户档案

```sql
-- 创建函数：当新用户注册时自动创建档案
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：当 auth.users 表有新用户时触发
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 4. 环境变量配置

在你的 `.env` 文件中添加以下配置：

```env
# Supabase配置
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 5. 实时订阅设置

如果需要实时数据同步，可以在 Supabase 控制台的 "Database" > "Replication" 中启用相关表的实时功能：

1. 启用 `travel_plans` 表的实时功能
2. 启用 `expenses` 表的实时功能
3. 启用 `user_preferences` 表的实时功能

## 6. 存储桶设置（可选）

如果需要上传用户头像或旅行照片，可以创建存储桶：

```sql
-- 创建头像存储桶
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- 创建存储策略
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 7. 测试连接

完成设置后，启动应用并测试：

1. 用户注册功能
2. 用户登录功能
3. 创建旅行计划
4. 添加费用记录
5. 数据同步功能

## 注意事项

- 确保所有表都启用了行级安全策略 (RLS)
- 定期备份数据库
- 监控 API 使用量
- 根据需要调整数据库性能设置
