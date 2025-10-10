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

// Специализированный хук для анализа контента
export function useContentAnalysis() {
  const api = useApi({
    onError: (error) => {
      console.error('Content analysis error:', error)
    }
  })

  const analyzeContent = useCallback(async (episodeId: string, podcastId: string) => {
    return api.execute(
      () => fetch('/api/ai/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId, podcastId })
      }),
      'Failed to analyze content'
    )
  }, [api])

  return {
    ...api,
    analyzeContent
  }
}

// Специализированный хук для анализа трендов эпизодов
export function useEpisodeTrends() {
  const api = useApi({
    onError: (error) => {
      console.error('Episode trends error:', error)
    }
  })

  const analyzeEpisodeTrends = useCallback(async (podcastId: string, timeRange: number = 30) => {
    return api.execute(
      () => fetch('/api/ai/analyze-episode-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podcastId, timeRange })
      }),
      'Failed to analyze episode trends'
    )
  }, [api])

  return {
    ...api,
    analyzeEpisodeTrends
  }
}

// Специализированный хук для сравнения с конкурентами
export function useCompetitorComparison() {
  const api = useApi({
    onError: (error) => {
      console.error('Competitor comparison error:', error)
    }
  })

  const analyzeCompetitorComparison = useCallback(async (podcastId: string, category: string) => {
    return api.execute(
      () => fetch('/api/ai/analyze-competitor-comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podcastId, category })
      }),
      'Failed to analyze competitor comparison'
    )
  }, [api])

  return {
    ...api,
    analyzeCompetitorComparison
  }
}

// Специализированный хук для прогнозирования успеха
export function useEpisodeSuccessPrediction() {
  const api = useApi({
    onError: (error) => {
      console.error('Episode success prediction error:', error)
    }
  })

  const predictEpisodeSuccess = useCallback(async (episodeId: string, podcastId: string, episodeData?: any) => {
    return api.execute(
      () => fetch('/api/ai/predict-episode-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId, podcastId, episodeData })
      }),
      'Failed to predict episode success'
    )
  }, [api])

  return {
    ...api,
    predictEpisodeSuccess
  }
}

// Специализированный хук для мониторинга качества
export function useQualityMonitoring() {
  const api = useApi({
    onError: (error) => {
      console.error('Quality monitoring error:', error)
    }
  })

  const checkQualityAlerts = useCallback(async (podcastId: string, checkType: string = 'all') => {
    return api.execute(
      () => fetch('/api/ai/quality-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podcastId, checkType })
      }),
      'Failed to check quality alerts'
    )
  }, [api])

  return {
    ...api,
    checkQualityAlerts
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
