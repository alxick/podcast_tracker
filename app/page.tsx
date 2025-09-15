import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Podcast Tracker
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Отслеживайте рост ваших подкастов, анализируйте конкурентов и получайте уведомления о важных изменениях
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/register">Начать бесплатно</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Войти</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle>📈 Мониторинг роста</CardTitle>
              <CardDescription>
                Отслеживайте позиции ваших подкастов в чартах Spotify и Apple Podcasts
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🤖 AI-анализ</CardTitle>
              <CardDescription>
                Анализируйте обложки подкастов и получайте рекомендации по улучшению
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🔔 Уведомления</CardTitle>
              <CardDescription>
                Получайте уведомления о росте, новых эпизодах и изменениях у конкурентов
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Тарифные планы
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}