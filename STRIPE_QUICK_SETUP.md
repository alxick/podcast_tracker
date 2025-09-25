# 🚀 Быстрая настройка Stripe

## 1. Добавить ключи в .env.local

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

## 2. Выполнить миграцию БД

В Supabase SQL Editor выполнить:
```sql
-- Содержимое файла: migrations/add_subscriptions_table.sql
```

## 3. Настроить Webhook в Stripe

1. Stripe Dashboard → Webhooks
2. Endpoint: `https://your-domain.com/api/stripe/webhook`
3. События: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Скопировать webhook secret

## 4. Готово!

Теперь планы подписки будут сохраняться в БД и не слетать после обновления страницы.

### Что исправлено:
- ✅ Убраны все тестовые переключения планов
- ✅ Убраны моки и заглушки
- ✅ Добавлена таблица `subscriptions` для отслеживания подписок
- ✅ Webhook автоматически обновляет план пользователя
- ✅ Планы сохраняются в БД и не слетают
