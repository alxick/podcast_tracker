import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@/lib/supabase/server'
import { Podcast, Episode, Chart, UserPodcast } from '@/lib/types/database'

// Создание клиента с Service Role для админских операций
function createServiceRoleClient() {
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Сохранение подкаста в БД (с Service Role)
export async function savePodcast(podcast: Omit<Podcast, 'id' | 'created_at'>) {
  const supabase = createServiceRoleClient()
  
  const { data, error } = await supabase
    .from('podcasts')
    .insert(podcast)
    .select()
    .single()
  
  if (error) {
    console.error('Error saving podcast:', error)
    throw new Error('Failed to save podcast')
  }
  
  return data
}

// Получение подкаста по ID
export async function getPodcast(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('podcasts')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error getting podcast:', error)
    throw new Error('Failed to get podcast')
  }
  
  return data
}

// Получение подкаста по source и source_id (с Service Role)
export async function getPodcastBySource(source: string, sourceId: string) {
  const supabase = createServiceRoleClient()
  
  const { data, error } = await supabase
    .from('podcasts')
    .select('*')
    .eq('source', source)
    .eq('source_id', sourceId)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error getting podcast by source:', error)
    throw new Error('Failed to get podcast by source')
  }
  
  return data || null
}

// Сохранение эпизодов подкаста
export async function saveEpisodes(episodes: Omit<Episode, 'id' | 'created_at'>[]) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('episodes')
    .insert(episodes)
    .select()
  
  if (error) {
    console.error('Error saving episodes:', error)
    throw new Error('Failed to save episodes')
  }
  
  return data
}

// Получение эпизодов подкаста
export async function getPodcastEpisodes(podcastId: string, limit = 50) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('podcast_id', podcastId)
    .order('published_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error getting podcast episodes:', error)
    throw new Error('Failed to get podcast episodes')
  }
  
  return data
}

// Сохранение позиций в чартах (с Service Role)
export async function saveChartPositions(charts: Omit<Chart, 'id' | 'created_at'>[]) {
  const supabase = createServiceRoleClient()
  
  const { data, error } = await supabase
    .from('charts')
    .insert(charts)
    .select()
  
  if (error) {
    console.error('Error saving chart positions:', error)
    throw new Error('Failed to save chart positions')
  }
  
  return data
}

// Получение истории позиций подкаста
export async function getPodcastChartHistory(podcastId: string, days = 30) {
  const supabase = await createClient()
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const { data, error } = await supabase
    .from('charts')
    .select('*')
    .eq('podcast_id', podcastId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true })
  
  if (error) {
    console.error('Error getting podcast chart history:', error)
    throw new Error('Failed to get podcast chart history')
  }
  
  return data
}

// Создание пользователя в БД
export async function createUser(userId: string, email: string) {
  const supabase = await createServiceRoleClient()
  
  const { data, error } = await supabase
    .from('users')
    .insert({ 
      id: userId, 
      email: email,
      password_hash: '', // Пустой пароль для OAuth пользователей
      plan: 'free',
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating user:', error)
    // Игнорируем ошибку если пользователь уже существует
    if (error.code !== '23505') {
      throw new Error('Failed to create user')
    }
  }
  
  return data
}

// Проверка существования пользователя
export async function userExists(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()
  
  return !error && data
}

// Добавление подкаста в отслеживание пользователя
export async function addUserPodcast(userId: string, podcastId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_podcasts')
    .insert({ user_id: userId, podcast_id: podcastId })
    .select()
    .single()
  
  if (error) {
    console.error('Error adding user podcast:', error)
    throw new Error('Failed to add user podcast')
  }
  
  return data
}

// Удаление подкаста из отслеживания пользователя
export async function removeUserPodcast(userId: string, podcastId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('user_podcasts')
    .delete()
    .eq('user_id', userId)
    .eq('podcast_id', podcastId)
  
  if (error) {
    console.error('Error removing user podcast:', error)
    throw new Error('Failed to remove user podcast')
  }
}

// Получение отслеживаемых подкастов пользователя
export async function getUserPodcasts(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_podcasts')
    .select(`
      *,
      podcasts (
        id,
        source,
        source_id,
        title,
        author,
        description,
        image_url,
        category
      )
    `)
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error getting user podcasts:', error)
    throw new Error('Failed to get user podcasts')
  }
  
  return data
}

// Проверка, отслеживает ли пользователь подкаст
export async function isUserTrackingPodcast(userId: string, podcastId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_podcasts')
    .select('id')
    .eq('user_id', userId)
    .eq('podcast_id', podcastId)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error checking user podcast tracking:', error)
    throw new Error('Failed to check user podcast tracking')
  }
  
  return !!data
}
