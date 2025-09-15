-- Podcast Tracker Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Пользователи
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'agency')),
  stripe_customer_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Подкасты
CREATE TABLE podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('spotify', 'apple')),
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,
  image_url TEXT,
  category TEXT,
  rss_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source, source_id)
);

-- Эпизоды
CREATE TABLE episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  published_at TIMESTAMP NOT NULL,
  duration INTEGER, -- в секундах
  description TEXT,
  audio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Чарты
CREATE TABLE charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('spotify', 'apple')),
  category TEXT NOT NULL,
  position INTEGER NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Подписки пользователей на подкасты
CREATE TABLE user_podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, podcast_id)
);

-- Настройки уведомлений
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  telegram_notifications BOOLEAN DEFAULT false,
  daily_digest BOOLEAN DEFAULT true,
  instant_alerts BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для оптимизации
CREATE INDEX idx_podcasts_source_id ON podcasts(source, source_id);
CREATE INDEX idx_episodes_podcast_id ON episodes(podcast_id);
CREATE INDEX idx_charts_podcast_date ON charts(podcast_id, date);
CREATE INDEX idx_user_podcasts_user_id ON user_podcasts(user_id);
CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);

-- RLS (Row Level Security) политики
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Политики для users
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Политики для podcasts (публичные данные)
CREATE POLICY "Podcasts are viewable by everyone" ON podcasts
  FOR SELECT USING (true);

-- Политики для episodes (публичные данные)
CREATE POLICY "Episodes are viewable by everyone" ON episodes
  FOR SELECT USING (true);

-- Политики для charts (публичные данные)
CREATE POLICY "Charts are viewable by everyone" ON charts
  FOR SELECT USING (true);

-- Политики для user_podcasts
CREATE POLICY "Users can view own subscriptions" ON user_podcasts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add own subscriptions" ON user_podcasts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON user_podcasts
  FOR DELETE USING (auth.uid() = user_id);

-- Политики для notification_settings
CREATE POLICY "Users can view own notification settings" ON notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" ON notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings" ON notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
