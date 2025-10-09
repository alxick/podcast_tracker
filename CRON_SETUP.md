# ⏰ Настройка Cron Jobs для Podcast Tracker

## Обзор

Cron jobs автоматически обновляют данные подкастов, чарты и отправляют уведомления пользователям. Система разделена на несколько типов задач для оптимизации производительности.

## Типы Cron Jobs

### 1. **Полное обновление** (`update`)
- **Частота:** Каждые 6 часов
- **Функции:** Обновляет чарты, эпизоды и отправляет уведомления
- **URL:** `/api/cron/update`

### 2. **Обновление чартов** (`charts`)
- **Частота:** Каждые 2 часа
- **Функции:** Обновляет позиции в чартах Apple Podcasts и Spotify
- **URL:** `/api/cron/charts`

### 3. **Обновление эпизодов** (`episodes`)
- **Частота:** Каждые 4 часа
- **Функции:** Обновляет эпизоды для отслеживаемых подкастов
- **URL:** `/api/cron/episodes`

### 4. **Обработка уведомлений** (`notifications`)
- **Частота:** Каждые 30 минут
- **Функции:** Отправляет уведомления пользователям
- **URL:** `/api/cron/notifications`

## Настройка в Production

### 1. **Railway (Рекомендуется)**

Создайте файл `railway.json`:

```json
{
  "cron": [
    {
      "name": "charts-update",
      "schedule": "0 */2 * * *",
      "command": "node scripts/cron.js charts"
    },
    {
      "name": "episodes-update", 
      "schedule": "0 */4 * * *",
      "command": "node scripts/cron.js episodes"
    },
    {
      "name": "notifications-update",
      "schedule": "*/30 * * * *",
      "command": "node scripts/cron.js notifications"
    },
    {
      "name": "full-update",
      "schedule": "0 */6 * * *",
      "command": "node scripts/cron.js update"
    }
  ]
}
```

### 2. **Vercel Cron Jobs**

Создайте файл `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/charts",
      "schedule": "0 */2 * * *"
    },
    {
      "path": "/api/cron/episodes", 
      "schedule": "0 */4 * * *"
    },
    {
      "path": "/api/cron/notifications",
      "schedule": "*/30 * * * *"
    },
    {
      "path": "/api/cron/update",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### 3. **Railway Cron Jobs (Альтернатива)**

Используйте Railway Cron Jobs:

```bash
# Установка Railway CLI
npm install -g @railway/cli

# Логин
railway login

# Создание cron job
railway cron create "charts-update" "0 */2 * * *" "node scripts/cron.js charts"
railway cron create "episodes-update" "0 */4 * * *" "node scripts/cron.js episodes"
railway cron create "notifications-update" "*/30 * * * *" "node scripts/cron.js notifications"
railway cron create "full-update" "0 */6 * * *" "node scripts/cron.js update"
```

## Переменные окружения

Убедитесь, что настроены следующие переменные:

```bash
# Обязательные
CRON_SECRET_TOKEN=your-secret-token-here
CRON_URL=https://your-app.vercel.app/api/cron

# Для уведомлений
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Для API
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
OPENAI_API_KEY=your-openai-key

# Для базы данных
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Локальная разработка

### 1. **Ручной запуск**

```bash
# Полное обновление
node scripts/cron.js update

# Только чарты
node scripts/cron.js charts

# Только эпизоды
node scripts/cron.js episodes

# Только уведомления
node scripts/cron.js notifications
```

### 2. **Тестирование через API**

```bash
# Тестирование через curl
curl -X POST https://your-app.vercel.app/api/cron/charts \
  -H "Authorization: Bearer your-secret-token"

# Или через GET (для тестирования)
curl https://your-app.vercel.app/api/cron/charts
```

### 3. **Локальный cron (для разработки)**

Добавьте в crontab:

```bash
# Открыть crontab
crontab -e

# Добавить задачи
0 */2 * * * cd /path/to/podcast-tracker && node scripts/cron.js charts
0 */4 * * * cd /path/to/podcast-tracker && node scripts/cron.js episodes
*/30 * * * * cd /path/to/podcast-tracker && node scripts/cron.js notifications
0 */6 * * * cd /path/to/podcast-tracker && node scripts/cron.js update
```

## Мониторинг и логирование

### 1. **Логи Railway**

```bash
# Просмотр логов cron jobs
railway logs --service cron

# Просмотр логов конкретной задачи
railway logs --service cron --filter "charts-update"
```

### 2. **Логи Vercel**

```bash
# Просмотр логов через Vercel CLI
vercel logs --follow

# Или через веб-интерфейс Vercel
```

### 3. **Мониторинг через API**

Создайте endpoint для проверки статуса:

```typescript
// app/api/cron/status/route.ts
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    lastUpdate: new Date().toISOString(),
    services: {
      charts: 'running',
      episodes: 'running', 
      notifications: 'running'
    }
  })
}
```

## Оптимизация производительности

### 1. **Ограничения по времени**

- **Charts update:** Максимум 10 минут
- **Episodes update:** Максимум 15 минут
- **Notifications:** Максимум 5 минут
- **Full update:** Максимум 30 минут

### 2. **Rate Limiting**

- **Apple Podcasts API:** 100 запросов в минуту
- **Spotify API:** 100 запросов в минуту
- **SendGrid:** 100 писем в минуту

### 3. **Batch Processing**

- Обрабатываем подкасты батчами по 10
- Задержка 100ms между запросами
- Ограничение на 100 подкастов за раз

## Troubleshooting

### 1. **Частые ошибки**

```bash
# Ошибка авторизации
Error: Unauthorized
# Решение: Проверить CRON_SECRET_TOKEN

# Ошибка API
Error: API rate limit exceeded
# Решение: Увеличить задержки между запросами

# Ошибка базы данных
Error: Database connection failed
# Решение: Проверить SUPABASE_SERVICE_ROLE_KEY
```

### 2. **Проверка статуса**

```bash
# Проверка через API
curl https://your-app.vercel.app/api/cron/status

# Проверка логов
railway logs --service cron --tail 100
```

### 3. **Ручной запуск для отладки**

```bash
# Запуск с подробными логами
DEBUG=* node scripts/cron.js charts

# Проверка переменных окружения
node -e "console.log(process.env.CRON_SECRET_TOKEN ? 'OK' : 'MISSING')"
```

## Безопасность

### 1. **Защита endpoints**

- Все cron endpoints защищены `CRON_SECRET_TOKEN`
- Используйте длинный случайный токен (32+ символов)
- Не коммитьте токен в репозиторий

### 2. **Ограничение доступа**

- Настройте IP whitelist для cron endpoints
- Используйте HTTPS для всех запросов
- Регулярно ротируйте токены

### 3. **Мониторинг**

- Настройте алерты на ошибки cron jobs
- Отслеживайте количество отправленных уведомлений
- Мониторьте использование API

## Рекомендации

1. **Начните с малого:** Запустите только обновление чартов
2. **Мониторьте производительность:** Следите за временем выполнения
3. **Тестируйте локально:** Всегда тестируйте изменения локально
4. **Резервное копирование:** Настройте бэкапы базы данных
5. **Документируйте изменения:** Ведите changelog для cron jobs

---

**Готово!** 🚀

Теперь у вас есть полноценная система cron jobs для автоматического обновления данных и отправки уведомлений.