# 🎧 Podcast Tracker MVP

SaaS-сервис для мониторинга подкастов с уведомлениями о росте и AI-анализом обложек.

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка переменных окружения
Скопируйте файл с примером переменных:
```bash
cp env.example .env.local
```

Заполните переменные в `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - URL вашего Supabase проекта
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key из Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key из Supabase
- `OPENAI_API_KEY` - API ключ OpenAI для AI-анализа
- `SENDGRID_API_KEY` - API ключ SendGrid для email
- `STRIPE_PUBLISHABLE_KEY` - Publishable key из Stripe
- `STRIPE_SECRET_KEY` - Secret key из Stripe
- `SPOTIFY_CLIENT_ID` - Client ID из Spotify App
- `SPOTIFY_CLIENT_SECRET` - Client Secret из Spotify App

### 3. Настройка Supabase
1. Создайте проект в [Supabase](https://supabase.com)
2. Включите Authentication (email/password)
3. Выполните SQL скрипт из `supabase-schema.sql` в SQL Editor

### 4. Запуск проекта
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 📁 Структура проекта

```
podcast-tracker/
├── app/                    # Next.js App Router
│   ├── (protected)/       # Защищенные страницы
│   │   ├── dashboard/     # Главная панель
│   │   ├── search/        # Поиск подкастов
│   │   ├── charts/        # Топ-чарты
│   │   ├── billing/       # Подписка
│   │   └── notifications/ # Настройки уведомлений
│   ├── login/             # Страница входа
│   ├── register/          # Страница регистрации
│   └── page.tsx           # Главная страница
├── components/            # React компоненты
│   ├── ui/               # shadcn/ui компоненты
│   └── layout/           # Компоненты макета
├── lib/                  # Утилиты и сервисы
│   ├── supabase/         # Supabase клиенты
│   └── types/            # TypeScript типы
└── supabase-schema.sql   # SQL схема БД
```

## 🛠️ Технологии

- **Frontend:** Next.js 14, TypeScript, TailwindCSS, shadcn/ui
- **Backend:** Next.js API Routes, Supabase
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth
- **Payments:** Stripe
- **AI:** OpenAI Vision API
- **Email:** SendGrid

## 📊 Функции MVP

### ✅ Реализовано
- [x] Базовая структура Next.js проекта
- [x] Настройка TailwindCSS и shadcn/ui
- [x] Конфигурация Supabase
- [x] Базовые страницы (главная, вход, регистрация)
- [x] Защищенные страницы с навигацией
- [x] SQL схема базы данных
- [x] TypeScript типы

### 🚧 В разработке
- [ ] Auth система (Supabase)
- [ ] API интеграции (Spotify, Apple)
- [ ] Поиск подкастов
- [ ] Система уведомлений
- [ ] AI-анализ обложек
- [ ] Stripe интеграция

## 📋 Следующие шаги

1. **Настройте Supabase** - создайте проект и выполните SQL скрипт
2. **Добавьте API ключи** - заполните переменные окружения
3. **Реализуйте Auth** - подключите Supabase Auth
4. **Добавьте API интеграции** - Spotify и Apple Podcasts
5. **Создайте поиск** - функционал поиска подкастов

## 🎯 Цели проекта

- **Целевая аудитория:** Создатели подкастов и маркетологи
- **Уникальные фичи:** Уведомления о росте, AI-анализ обложек
- **Монетизация:** Freemium ($10-30/мес) + корпоративные тарифы
- **Временные рамки:** 4 недели на MVP

## 📞 Поддержка

Если у вас есть вопросы или проблемы, создайте issue в репозитории.

---

**Готовы к разработке!** 🚀