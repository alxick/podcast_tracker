import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ChartsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Топ-чарты
        </h1>
        <p className="text-gray-600">
          Просматривайте популярные подкасты по категориям
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Фильтры</CardTitle>
            <CardDescription>
              Выберите платформу и категорию для просмотра чартов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline">Spotify</Button>
              <Button variant="outline">Apple Podcasts</Button>
              <Button variant="outline">Technology</Button>
              <Button variant="outline">Business</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Топ-50 подкастов</CardTitle>
            <CardDescription>
              Самые популярные подкасты в выбранной категории
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500">
                Выберите категорию для просмотра чартов
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
