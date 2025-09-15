export interface User {
  id: string
  email: string
  plan: 'free' | 'starter' | 'pro' | 'agency'
  stripe_customer_id?: string
  created_at: string
}

export interface Podcast {
  id: string
  source: 'spotify' | 'apple'
  source_id: string
  title: string
  author?: string
  description?: string
  image_url?: string
  category?: string
  rss_url?: string
  created_at: string
}

export interface Episode {
  id: string
  podcast_id: string
  title: string
  published_at: string
  duration?: number
  description?: string
  audio_url?: string
  created_at: string
}

export interface Chart {
  id: string
  podcast_id: string
  platform: 'spotify' | 'apple'
  category: string
  position: number
  date: string
  created_at: string
}

export interface UserPodcast {
  id: string
  user_id: string
  podcast_id: string
  created_at: string
}

export interface NotificationSettings {
  id: string
  user_id: string
  email_notifications: boolean
  telegram_notifications: boolean
  daily_digest: boolean
  instant_alerts: boolean
  created_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  features: string[]
  limits: {
    podcasts: number
    charts: number
    ai_analysis: boolean
    api_access: boolean
  }
}
