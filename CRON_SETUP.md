# ⏰ Настройка Cron-job для Podcast Tracker

## Описание

Cron-job автоматически обновляет данные чартов и эпизодов подкастов. Рекомендуется запускать ежедневно.

## Настройка переменных окружения

Добавьте в `.env.local`:

```env
# Cron Job Configuration
CRON_SECRET_TOKEN=your_secret_token_here
CRON_URL=http://localhost:3000/api/cron/update
```

## Локальная настройка

### 1. Ручной запуск

```bash
npm run cron
```

### 2. Настройка cron в системе

Добавьте в crontab (запуск каждый день в 6:00):

```bash
crontab -e
```

Добавьте строку:
```bash
0 6 * * * cd /path/to/podcast-tracker && npm run cron
```

## Настройка на сервере

### Railway/Render

1. Добавьте переменные окружения:
   - `CRON_SECRET_TOKEN` - секретный токен
   - `CRON_URL` - URL вашего API

2. Настройте cron job через внешний сервис (например, cron-job.org)

### Vercel

Vercel не поддерживает cron jobs напрямую. Используйте:

1. **Vercel Cron Jobs** (Pro план)
2. **Внешний сервис** (cron-job.org, EasyCron)
3. **GitHub Actions** с расписанием

#### GitHub Actions пример:

```yaml
name: Update Charts
on:
  schedule:
    - cron: '0 6 * * *'  # Каждый день в 6:00 UTC
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cron Job
        run: |
          curl -X POST "${{ secrets.CRON_URL }}" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_TOKEN }}" \
            -H "Content-Type: application/json"
```

## Мониторинг

### Логи

Cron job выводит логи в консоль:
- Успешное обновление чартов
- Ошибки при обновлении
- Количество обновленных записей

### Проверка работы

1. Запустите cron job вручную:
   ```bash
   npm run cron
   ```

2. Проверьте логи в консоли

3. Проверьте данные в БД (позиции в чартах)

## Настройка частоты

### Рекомендуемая частота:
- **Чарты**: 1 раз в день (6:00 UTC)
- **Эпизоды**: 1 раз в день (7:00 UTC)

### Для тестирования:
- Каждые 5 минут: `*/5 * * * *`
- Каждый час: `0 * * * *`

## Безопасность

1. **Используйте сильный секретный токен**
2. **Ограничьте доступ к API endpoint**
3. **Мониторьте логи на подозрительную активность**

## Troubleshooting

### Ошибка авторизации
- Проверьте `CRON_SECRET_TOKEN`
- Убедитесь, что токен совпадает в API и cron job

### Ошибка подключения
- Проверьте `CRON_URL`
- Убедитесь, что сервер доступен

### Ошибки API
- Проверьте логи сервера
- Убедитесь, что все API ключи настроены

---

**Готово!** Cron job настроен и готов к работе.
