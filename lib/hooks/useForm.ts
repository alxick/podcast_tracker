import { useState, useCallback } from 'react'

interface UseFormState<T> {
  values: T
  loading: boolean
  error: string
}

interface UseFormOptions<T> {
  initialValues: T
  onSubmit: (values: T) => Promise<void>
  onSuccess?: () => void
  onError?: (error: string) => void
  validate?: (values: T) => string | null
}

export function useForm<T extends Record<string, any>>(options: UseFormOptions<T>) {
  const [state, setState] = useState<UseFormState<T>>({
    values: options.initialValues,
    loading: false,
    error: ''
  })

  const setValue = useCallback((field: keyof T, value: any) => {
    setState(prev => ({
      ...prev,
      values: { ...prev.values, [field]: value },
      error: '' // Очищаем ошибку при изменении поля
    }))
  }, [])

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const reset = useCallback(() => {
    setState({
      values: options.initialValues,
      loading: false,
      error: ''
    })
  }, [options.initialValues])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Валидация
    if (options.validate) {
      const validationError = options.validate(state.values)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    setState(prev => ({ ...prev, loading: true, error: '' }))

    try {
      await options.onSubmit(state.values)
      options.onSuccess?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      options.onError?.(errorMessage)
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [state.values, options])

  return {
    values: state.values,
    loading: state.loading,
    error: state.error,
    setValue,
    setError,
    reset,
    handleSubmit
  }
}

// Специализированный хук для аутентификации
export function useAuthForm() {
  return useForm({
    initialValues: { email: '', password: '' },
    onSubmit: async () => {
      // Логика будет передана через props
    },
    validate: (values) => {
      if (!values.email) return 'Email is required'
      if (!values.password) return 'Password is required'
      if (!/\S+@\S+\.\S+/.test(values.email)) return 'Email is invalid'
      return null
    }
  })
}
