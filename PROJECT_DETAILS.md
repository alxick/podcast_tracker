Отлично 👌 Давай сделаем **подробное ТЗ для MVP Podcast Tracker**, чтобы ты мог завтра закинуть его в Cursor и сразу получить «живое» решение.

---

# 📑 ТЗ на MVP «Podcast Tracker»

## 1. Цель продукта

Сервис для мониторинга подкастов (через Spotify и Apple Podcasts).
Функционал MVP:

* Поиск и просмотр подкастов.
* Мониторинг топ-чартов (с категориями).
* Динамика позиций подкаста.
* Алерты о новых эпизодах.
* Простая панель для юзера.
* Freemium → ограниченный доступ, подписка через Stripe.

---

## 2. Архитектура

* **Backend:** Node.js (Express / Nest) или Python (FastAPI).
* **DB:** PostgreSQL (хранение подкастов, чартов, пользователей).
* **Frontend:** React (Next.js) + Tailwind.
* **Auth:** email/password (через Supabase/Auth0/Firebase).
* **Payments:** Stripe (subscription, \$10–30/мес).
* **Hosting:** Railway / Render / Vercel (MVP можно на бесплатных/дешёвых тарифах).

---

## 3. Источники данных

* **Spotify API**

  * `GET /search` → поиск подкастов.
  * `GET /shows/{id}` → инфо о шоу.
  * Чарты напрямую API не даёт → берём публичные чарты (например, [https://podcasts.apple.com/charts](https://podcasts.apple.com/charts) или [https://spotifycharts.com/podcasts](https://spotifycharts.com/podcasts), можно парсить JSON/HTML).

* **Apple Podcasts (iTunes Search API)**

  * `https://itunes.apple.com/search?term=podcast&media=podcast` → поиск.
  * Чарты → через RSS (пример: [https://itunes.apple.com/us/rss/toppodcasts/limit=50/genre=1310/json](https://itunes.apple.com/us/rss/toppodcasts/limit=50/genre=1310/json)).

---

## 4. Основные фичи

### 🔎 Поиск подкастов

* Поле поиска → ввод названия.
* Результат: список (название, обложка, автор, описание).
* Кнопка «Добавить в отслеживание».

### 📈 Мониторинг подкаста

* Страница подкаста:

  * Название, обложка, описание, категории.
  * Список последних эпизодов.
  * График: позиции в чарте (за последнюю неделю/месяц).

### 🏆 Топ-чарты

* Вкладка «Чарты».
* Выбор категории (например, Technology, Business).
* Таблица: Топ-50 подкастов.
* Кнопка «Добавить в отслеживание».

### 🔔 Алерты

* Cron-job раз в день:

  * проверять новые эпизоды у отслеживаемых подкастов,
  * проверять рост/падение в чартах.
* Отправка email (через Sendgrid / Postmark / любой SMTP).

### 👤 Личный кабинет

* Список отслеживаемых подкастов.
* Возможность удалить/добавить.
* Ограничение:

  * Free → 1 подкаст.
  * Paid → 10–20 подкастов.

### 💳 Подписка

* Stripe Checkout (simple integration).
* Free → доступ сразу.
* Upgrade → кнопка «Разблокировать больше подкастов / чарты».

---

## 5. База данных (PostgreSQL)

Таблицы (минимально):

* **users** (id, email, password\_hash, plan, stripe\_customer\_id, created\_at)
* **podcasts** (id, source \[spotify/apple], source\_id, title, author, description, image\_url, category, created\_at)
* **episodes** (id, podcast\_id, title, published\_at, duration, description)
* **charts** (id, podcast\_id, category, position, date)
* **user\_podcasts** (id, user\_id, podcast\_id)

---

## 6. Ограничения MVP

* Не делаем «прослушивания» (нет в API).
* Динамика позиций только по чартам (Apple RSS + Spotify-чарты).
* Только email-уведомления (без Telegram/Slack).
* UI минималистичный (без сложных фильтров).

---

## 7. Этапы разработки

1. **Backend:**

   * Auth (JWT).
   * Интеграция Spotify API (поиск, инфо).
   * Интеграция Apple RSS (чарты, поиск).
   * Cron-job для обновления чартов.

2. **Frontend:**

   * Логин/регистрация.
   * Dashboard (мои подкасты).
   * Charts (категории + топ-50).
   * Podcast detail (график позиций + эпизоды).

3. **Payments:**

   * Stripe Checkout (monthly plan).
   * Middleware: проверка тарифа (free/paid).

4. **Notifications:**

   * Email через SendGrid/Postmark.

5. **Deploy:**

   * Backend → Railway/Render.
   * DB → Supabase/Neon.
   * Front → Vercel.

---

## 8. Roadmap (реалистичный)

* Неделя 1 → Auth, DB, базовый backend.
* Неделя 2 → интеграция Spotify/Apple, cron обновления.
* Неделя 3 → фронт (dashboard + charts).
* Неделя 4 → Stripe + email алерты + деплой.
  👉 Через **1 месяц готовый MVP**.

---

Отлично 🚀
Вот тебе **структура UI для Podcast Tracker (MVP)** — в формате, чтобы ты мог прям скормить в Cursor и он сгенерил рабочие страницы и компоненты.

---

# 🎨 UI-структура Podcast Tracker

## Общие принципы

* **Фреймворк**: Next.js (React) + TailwindCSS.
* **UI-kit**: shadcn/ui (кнопки, карточки, таблицы, формы).
* **Навигация**: sidebar + topbar (стандартная SaaS-панель).
* **Цвета**: светлая тема (серый/синий), без лишнего.

---

## 📑 Страницы и разделы

### 1. **Login / Register**

* Поля: email, password.
* Кнопки: «Войти», «Создать аккаунт».
* Ошибки (toast).

---

### 2. **Dashboard (Главная)**

* Секция «Мои подкасты» (таблица/карточки):

  * Обложка, название, автор.
  * Последняя позиция в чарте.
  * Кнопка «Подробнее».
  * Кнопка «Удалить из отслеживания».
* Кнопка «+ Добавить подкаст».
* Лимит: Free = 1 подкаст, Paid = 10–20.

---

### 3. **Поиск подкастов**

* Поле поиска (по названию).
* Результаты: карточки (обложка, название, автор, категория).
* Кнопка «Добавить в отслеживание».

---

### 4. **Podcast Detail**

* Шапка: обложка, название, автор, описание, категории.
* **График динамики позиций** (line chart, 7/30 дней).
* Таблица последних эпизодов:

  * Название, дата релиза, длительность.
* Кнопка «Удалить из отслеживания».

---

### 5. **Charts (Топ-чарты)**

* Dropdown выбора платформы (Spotify / Apple).
* Dropdown выбора категории (Technology, Business, и т.д.).
* Таблица топ-50 подкастов:

  * Позиция, обложка, название, автор.
  * Кнопка «Добавить в отслеживание».

---

### 6. **Billing (Подписка)**

* Текущий план: Free / Paid.
* Сравнительная таблица:

  * Free: 1 подкаст, топ-10 чартов.
  * Paid (\$10/мес): 10 подкастов, полный чарт, алерты.
* Кнопка «Upgrade via Stripe».
* Если Paid → «Manage subscription».

---

### 7. **Notifications**

* Раздел «Уведомления» (пока только email).
* Тогглы:

  * «Новые эпизоды у моих подкастов».
  * «Изменение позиции в чарте».

---

## 🧩 Компоненты

* **Navbar** (слева): Dashboard, Charts, Billing, Notifications, Logout.
* **PodcastCard**: обложка, название, автор, кнопки (add/remove).
* **ChartTable**: таблица топ-50.
* **LineChart** (Recharts): динамика позиций.
* **Button**, **Input**, **Dropdown**, **Modal** — из shadcn/ui.

---

## 🔗 Навигация

* `/login` — вход.
* `/register` — регистрация.
* `/dashboard` — список подкастов.
* `/search` — поиск.
* `/podcast/[id]` — детальная страница.
* `/charts` — топ-чарты.
* `/billing` — подписка.
* `/notifications` — уведомления.

---

## 🕹️ Логика фри/пейд

* Везде проверка `user.plan`:

  * Free → 1 подкаст максимум, топ-10 чартов.
  * Paid → лимиты выше.
* В `Billing` показывать CTA «Обновить план».

---

📌 С этим ТЗ у тебя в Cursor получится сразу полноценный каркас: авторизация, страницы, компоненты, структура.
Останется только «подцепить» API (Spotify / Apple) и Stripe.

---

Окей, вот **чёткий порядок задач для Cursor**, чтобы завтра ты сел и сразу делал без хаоса.
Я разбил всё на блоки: сначала каркас, потом данные, потом деньги.

---

# 🛠️ Чеклист разработки Podcast Tracker (MVP)

## 🔑 Шаг 1. Базовый каркас

1. Создай проект (Next.js + TailwindCSS + shadcn/ui).
2. Настрой **Auth** (Supabase или Firebase, email/password).

   * Страницы: `/login`, `/register`.
   * После логина → редирект в `/dashboard`.
3. Добавь базовую навигацию (sidebar + topbar).

   * Разделы: Dashboard, Search, Charts, Billing, Notifications, Logout.

---

## 📊 Шаг 2. UI без данных

1. **Dashboard**

   * Пустой список «Мои подкасты».
   * Кнопка «+ Добавить подкаст».

2. **Search**

   * Поле ввода.
   * Карточки с результатами (mock-данные пока).

3. **Podcast Detail**

   * Шапка (обложка, название, описание).
   * Заглушка под график.
   * Таблица последних эпизодов (mock).

4. **Charts**

   * Dropdown выбора категории (mock-список).
   * Таблица топ-10 подкастов (mock).

5. **Billing**

   * Таблица сравнения Free vs Paid.
   * Кнопка «Upgrade».

6. **Notifications**

   * Тогглы (mock).

👉 На этом этапе у тебя «пустой SaaS», но с полной навигацией.

---

## 📡 Шаг 3. Подключаем данные

1. Подключи **Spotify API**:

   * `GET /search` (поиск подкастов).
   * `GET /shows/{id}` (детали подкаста).

2. Подключи **Apple Podcasts RSS**:

   * `https://itunes.apple.com/search?term=xxx&media=podcast` (поиск).
   * `https://itunes.apple.com/us/rss/toppodcasts/limit=50/genre=1310/json` (чарты).

3. Сохраняй данные в БД (Supabase/Postgres):

   * Таблицы `users`, `podcasts`, `episodes`, `charts`.

👉 Теперь поиск и чарты работают на реальных данных.

---

## 📈 Шаг 4. Аналитика и графики

1. Реализуй cron-job (каждый день):

   * обновлять чарты Apple/Spotify,
   * обновлять эпизоды для отслеживаемых подкастов.
2. На странице подкаста → график (Recharts) по позициям за последние 7–30 дней.

---

## 💳 Шаг 5. Монетизация

1. Интеграция Stripe Checkout:

   * Free → 1 подкаст, топ-10 чартов.
   * Paid → до 20 подкастов, топ-50 чартов.
2. Middleware: при попытке добавить 2-й подкаст у Free → редирект в `/billing`.
3. В Billing → кнопка «Upgrade via Stripe».

---

## 🔔 Шаг 6. Уведомления

1. Настрой email-сервис (Sendgrid / Postmark / Supabase SMTP).
2. Раз в день отправляй:

   * «У вашего подкаста вышел новый эпизод».
   * «Ваш подкаст поднялся/упал в чарте».

---

## 🚀 Шаг 7. Деплой

1. Frontend (Next.js) → Vercel.
2. Backend/cron (если отдельно) → Railway/Render.
3. DB → Supabase/Neon.

---

# 📌 Приоритет

* День 1–2 → Auth + каркас UI.
* День 3–4 → Search + Charts (mock → real data).
* День 5–7 → Podcast Detail + DB.
* Неделя 2 → Cron + графики.
* Неделя 3 → Stripe.
* Неделя 4 → Notifications + деплой.

👉 Через 1 месяц у тебя будет MVP, готовое для первых пользователей.

---

# 🚀 ДЕТАЛЬНЫЙ ПЛАН РАЗРАБОТКИ PODCAST TRACKER MVP

## 📋 ОБЗОР ПРОЕКТА

**Цель:** Создать SaaS-сервис для мониторинга подкастов с уведомлениями о росте и AI-анализом обложек.

**Целевая аудитория:** Создатели подкастов и маркетологи.

**Уникальные фичи:** 
- Уведомления о росте подкастов и конкурентов
- AI-анализ обложек (OpenAI Vision API)
- Простота vs enterprise-решения (Chartable)

**Монетизация:** Freemium ($10-30/мес) + корпоративные тарифы ($99-199/мес)

---

## 🗓️ ВРЕМЕННЫЕ РАМКИ: 4 НЕДЕЛИ

### **Неделя 1:** Базовый каркас + Auth
### **Неделя 2:** API интеграции + данные
### **Неделя 3:** UI + уведомления
### **Неделя 4:** Монетизация + деплой

---

## 📅 НЕДЕЛЯ 1: БАЗОВЫЙ КАРКАС + AUTH

### **День 1-2: Настройка проекта**

#### **1.1 Создание Next.js проекта**
```bash
npx create-next-app@latest podcast-tracker --typescript --tailwind --eslint --app
cd podcast-tracker
```

#### **1.2 Установка зависимостей**
```bash
# UI компоненты
npm install @radix-ui/react-slot @radix-ui/react-dropdown-menu @radix-ui/react-dialog
npm install class-variance-authority clsx tailwind-merge lucide-react

# Формы и валидация
npm install react-hook-form @hookform/resolvers zod

# Графики
npm install recharts

# HTTP клиент
npm install axios

# Утилиты
npm install date-fns
```

#### **1.3 Настройка shadcn/ui**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card table dropdown-menu dialog
```

#### **1.4 Настройка Supabase (Auth + DB)**
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

**Создать проект в Supabase:**
- Настроить Auth (email/password)
- Создать таблицы (см. схему БД ниже)

### **День 3-4: Auth система**

#### **1.5 Создание Auth компонентов**
- `components/auth/LoginForm.tsx`
- `components/auth/RegisterForm.tsx`
- `components/auth/AuthProvider.tsx`

#### **1.6 Настройка роутинга**
- `/login` - страница входа
- `/register` - страница регистрации
- `/dashboard` - главная (защищенная)
- `/search` - поиск подкастов
- `/podcast/[id]` - детальная страница
- `/charts` - топ-чарты
- `/billing` - подписка
- `/notifications` - настройки уведомлений

#### **1.7 Базовая навигация**
- `components/layout/Sidebar.tsx`
- `components/layout/Header.tsx`
- `components/layout/Layout.tsx`

### **День 5-7: Схема БД + базовые API**

#### **1.8 Создание схемы БД в Supabase**
```sql
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
```

#### **1.9 Базовые API роуты**
- `app/api/auth/` - auth endpoints
- `app/api/podcasts/` - работа с подкастами
- `app/api/charts/` - получение чартов
- `app/api/notifications/` - настройки уведомлений

---

## 📅 НЕДЕЛЯ 2: API ИНТЕГРАЦИИ + ДАННЫЕ

### **День 8-10: Spotify API интеграция**

#### **2.1 Настройка Spotify API**
```bash
npm install spotify-web-api-node
```

#### **2.2 Создание Spotify сервиса**
- `lib/services/spotify.ts` - поиск подкастов
- `lib/services/spotify-charts.ts` - парсинг чартов
- `app/api/spotify/search/route.ts` - API endpoint

#### **2.3 Функции поиска**
- Поиск подкастов по названию
- Получение детальной информации о подкасте
- Парсинг топ-чартов Spotify

### **День 11-13: Apple Podcasts интеграция**

#### **2.4 Создание Apple сервиса**
- `lib/services/apple.ts` - iTunes Search API
- `lib/services/apple-rss.ts` - парсинг RSS чартов
- `app/api/apple/search/route.ts` - API endpoint

#### **2.5 Функции Apple API**
- Поиск через iTunes Search API
- Парсинг RSS чартов по категориям
- Получение информации о подкасте

### **День 14: Cron-job для обновления данных**

#### **2.6 Настройка cron-job**
```bash
npm install node-cron
```

#### **2.7 Создание задач обновления**
- `lib/cron/update-charts.ts` - обновление чартов
- `lib/cron/update-episodes.ts` - обновление эпизодов
- `app/api/cron/update/route.ts` - API endpoint для cron

---

## 📅 НЕДЕЛЯ 3: UI + УВЕДОМЛЕНИЯ

### **День 15-17: Основные страницы**

#### **3.1 Dashboard страница**
- `app/dashboard/page.tsx` - список отслеживаемых подкастов
- `components/dashboard/PodcastCard.tsx` - карточка подкаста
- `components/dashboard/AddPodcastButton.tsx` - кнопка добавления

#### **3.2 Поиск подкастов**
- `app/search/page.tsx` - страница поиска
- `components/search/SearchForm.tsx` - форма поиска
- `components/search/SearchResults.tsx` - результаты поиска

#### **3.3 Детальная страница подкаста**
- `app/podcast/[id]/page.tsx` - детальная информация
- `components/podcast/PodcastHeader.tsx` - шапка подкаста
- `components/podcast/ChartGraph.tsx` - график позиций
- `components/podcast/EpisodesList.tsx` - список эпизодов

#### **3.4 Страница чартов**
- `app/charts/page.tsx` - топ-чарты
- `components/charts/ChartsTable.tsx` - таблица чартов
- `components/charts/CategoryFilter.tsx` - фильтр по категориям

### **День 18-19: AI-анализ обложек**

#### **3.5 OpenAI Vision API интеграция**
```bash
npm install openai
```

#### **3.6 Создание AI сервиса**
- `lib/services/ai-analysis.ts` - анализ обложек
- `app/api/ai/analyze-cover/route.ts` - API endpoint
- `components/ai/CoverAnalysis.tsx` - компонент анализа

#### **3.7 Функции AI-анализа**
- Анализ цветовой палитры
- Детекция текста на обложке
- Сравнение с конкурентами
- Генерация рекомендаций

### **День 20-21: Система уведомлений**

#### **3.8 Email уведомления**
```bash
npm install @sendgrid/mail
```

#### **3.9 Создание сервиса уведомлений**
- `lib/services/notifications.ts` - отправка уведомлений
- `lib/templates/email-templates.ts` - шаблоны писем
- `app/api/notifications/send/route.ts` - API endpoint

#### **3.10 Типы уведомлений**
- Ежедневный дайджест
- Instant-алерты при скачках
- Уведомления о новых эпизодах
- Анализ конкурентов

---

## 📅 НЕДЕЛЯ 4: МОНЕТИЗАЦИЯ + ДЕПЛОЙ

### **День 22-24: Stripe интеграция**

#### **4.1 Настройка Stripe**
```bash
npm install stripe @stripe/stripe-js
```

#### **4.2 Создание платежной системы**
- `lib/services/stripe.ts` - Stripe конфигурация
- `app/api/stripe/create-checkout/route.ts` - создание сессии
- `app/api/stripe/webhook/route.ts` - webhook обработка
- `components/billing/SubscriptionCard.tsx` - карточка подписки

#### **4.3 Тарифные планы**
- Free: 1 подкаст, топ-10 чартов
- Starter ($10/мес): 5 подкастов, топ-50 чартов
- Pro ($20/мес): 20 подкастов, топ-200, AI-анализ
- Agency ($99/мес): 100+ подкастов, экспорт, API

### **День 25-26: Middleware и ограничения**

#### **4.4 Создание middleware**
- `middleware.ts` - проверка подписки
- `lib/utils/subscription-limits.ts` - лимиты по тарифам
- `components/upgrade/UpgradePrompt.tsx` - промпт апгрейда

#### **4.5 Ограничения по тарифам**
- Лимиты на количество подкастов
- Ограничения доступа к чартам
- AI-анализ только для Pro+

### **День 27-28: Деплой и тестирование**

#### **4.6 Настройка деплоя**
- Frontend: Vercel
- Backend: Railway/Render
- Database: Supabase
- Cron: Railway/Render

#### **4.7 Финальное тестирование**
- Тестирование всех функций
- Проверка платежей
- Тестирование уведомлений
- Оптимизация производительности

---

## 🛠️ ТЕХНИЧЕСКИЕ ДЕТАЛИ

### **Стек технологий:**
- **Frontend:** Next.js 14, TypeScript, TailwindCSS, shadcn/ui
- **Backend:** Next.js API Routes, Supabase
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth
- **Payments:** Stripe
- **AI:** OpenAI Vision API
- **Email:** SendGrid
- **Charts:** Recharts
- **Deploy:** Vercel + Railway

### **API интеграции:**
- **Spotify Web API** - поиск подкастов, детали
- **Apple iTunes Search API** - поиск подкастов
- **Apple RSS** - парсинг чартов
- **OpenAI Vision API** - анализ обложек
- **SendGrid API** - отправка email

### **Ключевые компоненты:**
- `PodcastCard` - карточка подкаста
- `ChartGraph` - график позиций
- `CoverAnalysis` - AI-анализ обложки
- `SubscriptionCard` - управление подпиской
- `NotificationSettings` - настройки уведомлений

---

## 📊 МЕТРИКИ УСПЕХА

### **Технические:**
- Время загрузки страниц < 2 сек
- Uptime > 99%
- Успешность API запросов > 95%

### **Бизнес:**
- 100+ регистраций в первый месяц
- 10+ платных подписок в первый месяц
- Retention rate > 30% через месяц

### **Пользовательские:**
- Время на странице > 3 мин
- Количество отслеживаемых подкастов > 2
- Открываемость email > 20%

---

## 🚀 ГОТОВЫ К СТАРТУ!

Этот план дает четкую дорожную карту для создания MVP за 4 недели. Каждый день имеет конкретные задачи и ожидаемые результаты.

**Начинаем с Дня 1: Создание Next.js проекта!** 🎯

---

