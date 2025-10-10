'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useForm } from '@/lib/hooks/useForm'

export function LoginForm() {
  const { signIn } = useAuth()
  const router = useRouter()

  const form = useForm({
    initialValues: { email: '', password: '' },
    onSubmit: async (values) => {
      const { error } = await signIn(values.email, values.password)
      if (error) {
        throw new Error(error.message)
      } else {
        router.push('/dashboard')
      }
    },
    validate: (values) => {
      if (!values.email) return 'Email is required'
      if (!values.password) return 'Password is required'
      if (!/\S+@\S+\.\S+/.test(values.email)) return 'Email is invalid'
      return null
    }
  })

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Вход в аккаунт</CardTitle>
        <CardDescription>
          Введите email и пароль для входа
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit} className="space-y-4">
          {form.error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {form.error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={form.values.email}
              onChange={(e) => form.setValue('email', e.target.value)}
              placeholder="your@email.com"
              required
              disabled={form.loading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <Input
              id="password"
              type="password"
              value={form.values.password}
              onChange={(e) => form.setValue('password', e.target.value)}
              placeholder="••••••••"
              required
              disabled={form.loading}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={form.loading}>
            {form.loading ? 'Вход...' : 'Войти'}
          </Button>
        </form>
        
        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">Нет аккаунта? </span>
          <Link href="/register" className="text-blue-600 hover:text-blue-500">
            Зарегистрироваться
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
