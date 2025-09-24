# 🎧 Podcast Tracker MVP

SaaS-сервис для мониторинга подкастов с уведомлениями о росте и AI-анализом обложек.

## ✨ Функции

- 🔍 **Поиск подкастов** - Spotify и Apple Podcasts
- 📊 **Мониторинг чартов** - отслеживание позиций в топ-чартах
- 📈 **Графики роста** - визуализация динамики позиций
- 🤖 **AI-анализ обложек** - анализ дизайна и рекомендации
- 🔔 **Уведомления** - email алерты о росте и новых эпизодах
- 💳 **Монетизация** - freemium модель с Stripe
- 📱 **Адаптивный дизайн** - работает на всех устройствах

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
│   │   ├── notifications/ # Настройки уведомлений
│   │   └── podcast/[id]/  # Детальная страница подкаста
│   ├── api/              # API роуты
│   │   ├── auth/         # Авторизация
│   │   ├── podcasts/     # Подкасты
│   │   ├── charts/       # Чарты
│   │   ├── stripe/       # Платежи
│   │   ├── ai/           # AI-анализ
│   │   └── cron/         # Cron jobs
│   ├── login/            # Страница входа
│   ├── register/         # Страница регистрации
│   └── page.tsx          # Главная страница
├── components/           # React компоненты
│   ├── ui/              # shadcn/ui компоненты
│   ├── layout/          # Компоненты макета
│   ├── auth/            # Авторизация
│   ├── search/          # Поиск
│   ├── podcast/         # Подкасты
│   └── upgrade/         # Обновление планов
├── lib/                 # Утилиты и сервисы
│   ├── supabase/        # Supabase клиенты
│   ├── services/        # API сервисы
│   ├── types/           # TypeScript типы
│   └── utils/           # Утилиты
└── scripts/             # Скрипты
```

## 🛠️ Технологии

- **Frontend:** Next.js 14, TypeScript, TailwindCSS, shadcn/ui
- **Backend:** Next.js API Routes, Supabase
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth
- **Payments:** Stripe
- **AI:** OpenAI Vision API
- **Email:** SendGrid
- **Charts:** Recharts
- **Deploy:** Vercel + Railway

## 📊 Функции MVP

### ✅ Реализовано
- [x] **Auth система** - регистрация, вход, защищенные маршруты
- [x] **API интеграции** - Spotify и Apple Podcasts
- [x] **Поиск подкастов** - с фильтрацией по платформам
- [x] **Детальный просмотр** - информация о подкасте, эпизоды
- [x] **Чарты с графиками** - интерактивные графики позиций
- [x] **AI-анализ обложек** - анализ цветов, текста, рекомендации
- [x] **Система уведомлений** - email дайджесты и алерты
- [x] **Stripe интеграция** - подписки и платежи
- [x] **Cron jobs** - автоматическое обновление данных
- [x] **Ограничения по тарифам** - middleware для планов

### 🚀 Готово к деплою
- [x] **Vercel конфигурация** - готово к деплою
- [x] **Railway настройка** - для cron jobs
- [x] **Документация** - инструкции по деплою

## 💳 Тарифные планы

| План | Цена | Подкасты | Чарты | AI-анализ | API |
|------|------|----------|-------|-----------|-----|
| **Free** | $0/мес | 1 | Топ-10 | ❌ | ❌ |
| **Starter** | $10/мес | 5 | Топ-50 | ❌ | ❌ |
| **Pro** | $20/мес | 20 | Топ-200 | ✅ | ❌ |
| **Agency** | $99/мес | 100+ | Все | ✅ | ✅ |

## 📋 Следующие шаги

1. **Настройте Supabase** - создайте проект и выполните SQL скрипт
2. **Добавьте API ключи** - заполните переменные окружения
3. **Настройте Stripe** - создайте products и webhook
4. **Деплойте проект** - следуйте инструкциям в `DEPLOYMENT.md`
5. **Настройте cron jobs** - для автоматического обновления

## 📚 Документация

- [Настройка Supabase](SUPABASE_SETUP.md)
- [Настройка Cron Jobs](CRON_SETUP.md)
- [Инструкция по деплою](DEPLOYMENT.md)
- [Детали проекта](PROJECT_DETAILS.md)

## 🎯 Цели проекта

- **Целевая аудитория:** Создатели подкастов и маркетологи
- **Уникальные фичи:** Уведомления о росте, AI-анализ обложек
- **Монетизация:** Freemium ($10-30/мес) + корпоративные тарифы
- **Временные рамки:** 4 недели на MVP

## 📞 Поддержка

Если у вас есть вопросы или проблемы, создайте issue в репозитории.

---

**MVP готов к деплою!** 🚀