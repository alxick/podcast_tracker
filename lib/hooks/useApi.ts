import { useState, useCallback } from 'react'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function useApi<T = any>(options?: UseApiOptions) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const execute = useCallback(async (
    apiCall: () => Promise<Response>,
    errorMessage?: string
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await apiCall()
      
      if (response.ok) {
        const data = await response.json()
        setState({ data, loading: false, error: null })
        options?.onSuccess?.(data)
        return data
      } else {
        const errorData = await response.json()
        const error = errorData.error || errorMessage || 'Request failed'
        setState(prev => ({ ...prev, loading: false, error }))
        options?.onError?.(error)
        throw new Error(error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
      options?.onError?.(errorMessage)
      throw error
    }
  }, [options])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    ...state,
    execute,
    reset
  }
}

// Специализированный хук для AI анализа
export function useAIAnalysis() {
  const api = useApi({
    onError: (error) => {
      console.error('AI Analysis error:', error)
    }
  })

  const runAnalysis = useCallback(async (podcastId: string) => {
    return api.execute(
      () => fetch('/api/ai/analyze-position-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podcastId })
      }),
      'Failed to analyze position changes'
    )
  }, [api])

  return {
    ...api,
    runAnalysis
  }
}

// Специализированный хук для анализа трендов (вместо анализа обложек)
export function useTrendAnalysis() {
  const api = useApi({
    onError: (error) => {
      console.error('Trend analysis error:', error)
    }
  })

  const analyzeTrends = useCallback(async (podcastId: string, category: string) => {
    return api.execute(
      () => fetch('/api/ai/analyze-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podcastId, category })
      }),
      'Failed to analyze trends'
    )
  }, [api])

  return {
    ...api,
    analyzeTrends
  }
}

// Специализированный хук для загрузки данных чартов
export function useChartData() {
  const api = useApi({
    onError: (error) => {
      console.error('Chart data error:', error)
    }
  })

  const loadChartData = useCallback(async (podcastId: string, days: number = 30) => {
    return api.execute(
      () => fetch(`/api/charts/${podcastId}/history?days=${days}`),
      'Failed to load chart data'
    )
  }, [api])

  return {
    ...api,
    loadChartData
  }
}
