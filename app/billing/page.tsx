import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function BillingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Подписка
        </h1>
        <p className="text-gray-600">
          Управляйте своей подпиской и тарифным планом
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Текущий план</CardTitle>
            <CardDescription>
              Ваша текущая подписка
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Free</h3>
                <p className="text-sm text-gray-600">Бесплатный план</p>
              </div>
              <Button variant="outline">Обновить план</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Бесплатно</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• 1 подкаст</li>
                <li>• Топ-10 чартов</li>
                <li>• Ежедневный дайджест</li>
              </ul>
              <Button className="w-full mt-4" disabled>
                Текущий план
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-500">
            <CardHeader>
              <CardTitle>Starter</CardTitle>
              <CardDescription>$10/месяц</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• 5 подкастов</li>
                <li>• Топ-50 чартов</li>
                <li>• Email уведомления</li>
                <li>• Анализ конкурентов</li>
              </ul>
              <Button className="w-full mt-4">
                Выбрать план
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>$20/месяц</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• 20 подкастов</li>
                <li>• Топ-200 чартов</li>
                <li>• AI-анализ обложек</li>
                <li>• Telegram уведомления</li>
              </ul>
              <Button className="w-full mt-4">
                Выбрать план
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
