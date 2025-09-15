import { createClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplates } from './email'
import { getPodcastChartHistory, getUserPodcasts } from './database'

// Отправка ежедневного дайджеста
export async function sendDailyDigest() {
  try {
    const supabase = await createClient()
    
    // Получаем всех пользователей с включенными уведомлениями
    const { data: users, error } = await supabase
      .from('notification_settings')
      .select(`
        user_id,
        users!inner(email)
      `)
      .eq('daily_digest', true)
      .eq('email_notifications', true)

    if (error) {
      console.error('Error fetching users for daily digest:', error)
      return
    }

    if (!users || users.length === 0) {
      console.log('No users with daily digest enabled')
      return
    }

    for (const user of users) {
      try {
        // Получаем отслеживаемые подкасты пользователя
        const userPodcasts = await getUserPodcasts(user.user_id)
        
        if (userPodcasts.length === 0) {
          continue
        }

        // Анализируем изменения за последние 24 часа
        const digestData = {
          podcasts: await Promise.all(
            userPodcasts.map(async (userPodcast) => {
              const podcast = userPodcast.podcasts
              
              // Получаем историю позиций за последние 2 дня
              const history = await getPodcastChartHistory(podcast.id, 2)
              
              // Вычисляем изменение позиции
              let positionChange = 0
              if (history.length >= 2) {
                const today = history[history.length - 1]
                const yesterday = history[history.length - 2]
                positionChange = yesterday.position - today.position
              }
              
              // Подсчитываем новые эпизоды (заглушка)
              const newEpisodes = Math.floor(Math.random() * 3) // Mock data
              
              return {
                title: podcast.title,
                positionChange,
                newEpisodes
              }
            })
          )
        }

        // Отправляем дайджест
        const template = emailTemplates.dailyDigest(user.users.email, digestData)
        await sendEmail(template)
        
        console.log(`Daily digest sent to ${user.users.email}`)
      } catch (error) {
        console.error(`Error sending daily digest to user ${user.user_id}:`, error)
      }
    }
  } catch (error) {
    console.error('Error in sendDailyDigest:', error)
  }
}

// Отправка уведомления о значительном изменении позиции
export async function sendPositionAlert(userId: string, podcastId: string, oldPosition: number, newPosition: number) {
  try {
    const supabase = await createClient()
    
    // Получаем настройки пользователя
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('instant_alerts, email_notifications')
      .eq('user_id', userId)
      .single()

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError)
      return
    }

    if (!settings?.instant_alerts || !settings?.email_notifications) {
      return
    }

    // Получаем email пользователя
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (!user) {
      return
    }

    // Получаем информацию о подкасте
    const { data: podcast } = await supabase
      .from('podcasts')
      .select('title')
      .eq('id', podcastId)
      .single()

    if (!podcast) {
      return
    }

    const change = oldPosition - newPosition
    
    // Отправляем уведомление только при значительном изменении (>5 позиций)
    if (Math.abs(change) >= 5) {
      const template = emailTemplates.positionAlert(user.email, {
        podcastTitle: podcast.title,
        oldPosition,
        newPosition,
        change
      })
      
      await sendEmail(template)
      console.log(`Position alert sent to ${user.email} for ${podcast.title}`)
    }
  } catch (error) {
    console.error('Error sending position alert:', error)
  }
}

// Отправка уведомления о новом эпизоде
export async function sendNewEpisodeAlert(userId: string, podcastId: string, episode: {
  title: string
  published_at: string
}) {
  try {
    const supabase = await createClient()
    
    // Получаем настройки пользователя
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('email_notifications')
      .eq('user_id', userId)
      .single()

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError)
      return
    }

    if (!settings?.email_notifications) {
      return
    }

    // Получаем email пользователя
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (!user) {
      return
    }

    // Получаем информацию о подкасте
    const { data: podcast } = await supabase
      .from('podcasts')
      .select('title')
      .eq('id', podcastId)
      .single()

    if (!podcast) {
      return
    }

    const template = emailTemplates.newEpisode(user.email, {
      podcastTitle: podcast.title,
      episodeTitle: episode.title,
      publishedAt: episode.published_at
    })
    
    await sendEmail(template)
    console.log(`New episode alert sent to ${user.email} for ${podcast.title}`)
  } catch (error) {
    console.error('Error sending new episode alert:', error)
  }
}

// Отправка приветственного письма
export async function sendWelcomeEmail(userId: string) {
  try {
    const supabase = await createClient()
    
    // Получаем email пользователя
    const { data: user, error } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user for welcome email:', error)
      return
    }

    if (!user) {
      console.warn('User not found for welcome email:', userId)
      return
    }

    const template = emailTemplates.welcome(user.email)
    const result = await sendEmail(template)
    
    if (result.success) {
      console.log(`Welcome email sent to ${user.email}`)
    } else {
      console.error(`Failed to send welcome email to ${user.email}:`, result.error)
    }
  } catch (error) {
    console.error('Error sending welcome email:', error)
  }
}
