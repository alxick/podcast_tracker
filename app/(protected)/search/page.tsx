import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Поиск подкастов
        </h1>
        <p className="text-gray-600">
          Найдите подкасты для отслеживания в Spotify и Apple Podcasts
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Поиск</CardTitle>
          <CardDescription>
            Введите название подкаста для поиска
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Введите название подкаста..."
              className="flex-1"
            />
            <Button>Найти</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Результаты поиска</CardTitle>
          <CardDescription>
            Найденные подкасты
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">
              Введите запрос для поиска подкастов
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
