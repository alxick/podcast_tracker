# 🔧 Настройка Supabase для Podcast Tracker

## 1. Создание проекта в Supabase

1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите "Start your project"
3. Войдите в аккаунт или зарегистрируйтесь
4. Создайте новый проект:
   - **Name:** podcast-tracker
   - **Database Password:** создайте надежный пароль
   - **Region:** выберите ближайший регион
   - **Pricing Plan:** Free (для MVP)

## 2. Получение API ключей

После создания проекта:

1. Перейдите в **Settings** → **API**
2. Скопируйте:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## 3. Настройка Authentication

1. Перейдите в **Authentication** → **Settings**
2. Включите **Email** провайдер
3. Отключите **Enable email confirmations** (для MVP)
4. Сохраните настройки

## 4. Создание таблиц базы данных

1. Перейдите в **SQL Editor**
2. Скопируйте и выполните SQL скрипт из `supabase-schema.sql`
3. Проверьте, что все таблицы созданы в **Table Editor**

## 5. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## 6. Тестирование подключения

После настройки:

1. Запустите проект: `npm run dev`
2. Откройте http://localhost:3000
3. Попробуйте зарегистрироваться
4. Проверьте, что пользователь появился в **Authentication** → **Users**

## 7. Настройка Row Level Security (RLS)

RLS уже настроен в SQL скрипте, но убедитесь, что:

1. Все таблицы имеют включенный RLS
2. Политики созданы корректно
3. Пользователи могут видеть только свои данные

## 8. Полезные ссылки

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Authentication Guide](https://supabase.com/docs/guides/auth)

---

**Готово!** Теперь ваш проект подключен к Supabase и готов к работе с авторизацией.
