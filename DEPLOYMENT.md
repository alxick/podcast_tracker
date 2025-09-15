# 🚀 Инструкция по деплою Podcast Tracker

## Обзор архитектуры

- **Frontend**: Vercel (Next.js)
- **Backend**: Vercel (API Routes)
- **Database**: Supabase
- **Cron Jobs**: Railway/Render
- **Email**: SendGrid
- **Payments**: Stripe

## 1. Подготовка к деплою

### 1.1 Настройка переменных окружения

Создайте `.env.production` с переменными:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Spotify
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
CRON_SECRET_TOKEN=your_cron_secret_token
```

### 1.2 Настройка Supabase

1. Создайте проект в [Supabase](https://supabase.com)
2. Выполните SQL скрипт из `supabase-schema.sql`
3. Настройте RLS политики
4. Получите API ключи

### 1.3 Настройка SendGrid

1. Создайте аккаунт в [SendGrid](https://sendgrid.com)
2. Создайте API ключ
3. Настройте домен для отправки email

### 1.4 Настройка Stripe

1. Создайте аккаунт в [Stripe](https://stripe.com)
2. Получите API ключи
3. Настройте webhook endpoint: `https://your-app.vercel.app/api/stripe/webhook`
4. Создайте products и prices в Stripe Dashboard

### 1.5 Настройка Spotify API

1. Создайте приложение в [Spotify Developer](https://developer.spotify.com)
2. Получите Client ID и Client Secret
3. Настройте redirect URI

## 2. Деплой на Vercel

### 2.1 Подготовка репозитория

```bash
# Создайте репозиторий на GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/podcast-tracker.git
git push -u origin main
```

### 2.2 Деплой на Vercel

1. Перейдите на [Vercel](https://vercel.com)
2. Подключите GitHub репозиторий
3. Настройте переменные окружения в Vercel Dashboard
4. Деплойте проект

### 2.3 Настройка домена (опционально)

1. В Vercel Dashboard добавьте кастомный домен
2. Настройте DNS записи
3. Обновите `NEXT_PUBLIC_APP_URL` в переменных окружения

## 3. Деплой Cron Jobs на Railway

### 3.1 Создание Railway проекта

1. Перейдите на [Railway](https://railway.app)
2. Создайте новый проект
3. Подключите GitHub репозиторий

### 3.2 Настройка переменных окружения

Добавьте те же переменные, что и в Vercel, плюс:

```env
CRON_URL=https://your-app.vercel.app/api/cron/update
```

### 3.3 Настройка Cron Job

1. В Railway Dashboard создайте Cron Job
2. Настройте расписание: `0 6 * * *` (каждый день в 6:00 UTC)
3. Команда: `npm run cron`

## 4. Альтернативный деплой на Render

### 4.1 Создание Render проекта

1. Перейдите на [Render](https://render.com)
2. Создайте новый Web Service
3. Подключите GitHub репозиторий

### 4.2 Настройка переменных окружения

Добавьте все переменные окружения

### 4.3 Настройка Cron Job

1. Создайте Cron Job в Render
2. Настройте расписание
3. Команда: `npm run cron`

## 5. Настройка мониторинга

### 5.1 Vercel Analytics

1. Включите Vercel Analytics в Dashboard
2. Настройте мониторинг производительности

### 5.2 Supabase Monitoring

1. Настройте мониторинг в Supabase Dashboard
2. Настройте алерты на превышение лимитов

### 5.3 Stripe Monitoring

1. Настройте webhook monitoring в Stripe Dashboard
2. Настройте алерты на ошибки

## 6. Тестирование деплоя

### 6.1 Функциональное тестирование

1. Регистрация и авторизация
2. Поиск подкастов
3. Добавление в отслеживание
4. Просмотр чартов
5. AI-анализ обложек
6. Настройка уведомлений
7. Подписка на планы

### 6.2 Тестирование API

```bash
# Тест поиска подкастов
curl "https://your-app.vercel.app/api/podcasts/search?q=technology"

# Тест чартов
curl "https://your-app.vercel.app/api/charts?platform=apple&category=1310"

# Тест cron job
curl -X POST "https://your-app.vercel.app/api/cron/update" \
  -H "Authorization: Bearer your_cron_secret_token"
```

### 6.3 Тестирование Stripe

1. Создайте тестовую подписку
2. Проверьте webhook обработку
3. Протестируйте отмену подписки

## 7. Мониторинг и поддержка

### 7.1 Логи

- **Vercel**: Function logs в Dashboard
- **Supabase**: Logs в Dashboard
- **Railway/Render**: Application logs

### 7.2 Метрики

- Количество пользователей
- Количество подписок
- API использование
- Ошибки и производительность

### 7.3 Поддержка

- Настройте email для поддержки
- Создайте FAQ
- Настройте мониторинг ошибок (Sentry)

## 8. Безопасность

### 8.1 Переменные окружения

- Никогда не коммитьте `.env` файлы
- Используйте сильные секретные ключи
- Регулярно ротируйте ключи

### 8.2 API Security

- Настройте CORS правильно
- Используйте rate limiting
- Валидируйте все входные данные

### 8.3 Database Security

- Настройте RLS политики
- Регулярно делайте бэкапы
- Мониторьте подозрительную активность

## 9. Масштабирование

### 9.1 Когда масштабировать

- > 1000 пользователей
- > 100 подписок
- Высокая нагрузка на API

### 9.2 Опции масштабирования

- Vercel Pro план
- Supabase Pro план
- CDN для статических файлов
- Кэширование API ответов

---

**Готово!** Ваш Podcast Tracker развернут и готов к работе! 🎉
