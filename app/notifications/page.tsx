import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function NotificationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Уведомления
        </h1>
        <p className="text-gray-600">
          Настройте уведомления о ваших подкастах
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Email уведомления</CardTitle>
            <CardDescription>
              Настройте получение уведомлений по email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Ежедневный дайджест</h3>
                <p className="text-sm text-gray-600">
                  Сводка изменений за день
                </p>
              </div>
              <Button variant="outline" size="sm">
                Включено
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Мгновенные уведомления</h3>
                <p className="text-sm text-gray-600">
                  Уведомления о значительных изменениях
                </p>
              </div>
              <Button variant="outline" size="sm">
                Выключено
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Telegram уведомления</CardTitle>
            <CardDescription>
              Получайте уведомления в Telegram
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">
                Подключите Telegram для получения уведомлений
              </p>
              <Button variant="outline">
                Подключить Telegram
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
