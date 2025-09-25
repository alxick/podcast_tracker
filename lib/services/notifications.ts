import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendEmail } from './email'
import { PositionChange } from './ai-analysis'
import { NotificationSettings } from '@/lib/types/database'

// Получение настроек уведомлений пользователя
export async function getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
  const supabase = createServiceRoleClient()
  
  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Настройки не найдены, создаем дефолтные
      return await createDefaultNotificationSettings(userId)
    }
    console.error('Error getting notification settings:', error)
    return null
  }

  return data
}

// Создание дефолтных настроек уведомлений
export async function createDefaultNotificationSettings(userId: string): Promise<NotificationSettings> {
  const supabase = createServiceRoleClient()
  
  const defaultSettings: Omit<NotificationSettings, 'id' | 'created_at'> = {
    user_id: userId,
    email_frequency: 'weekly',
    notification_types: {
      position_changes: true,
      new_episodes: false,
      competitor_actions: false,
      trends: false
    }
  }

  const { data, error } = await supabase
    .from('notification_settings')
    .insert({
      ...defaultSettings,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating notification settings:', error)
    throw new Error('Failed to create notification settings')
  }

  return data
}

// Обновление настроек уведомлений
export async function updateNotificationSettings(
  userId: string, 
  settings: Partial<Omit<NotificationSettings, 'user_id' | 'created_at'>>
): Promise<NotificationSettings> {
  const supabase = createServiceRoleClient()
  
  const { data, error } = await supabase
    .from('notification_settings')
    .update(settings)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating notification settings:', error)
    throw new Error('Failed to update notification settings')
  }

  return data
}

// Проверка изменений позиций и отправка уведомлений
export async function checkPositionChanges(): Promise<void> {
  const supabase = createServiceRoleClient()
  
  // Получаем всех пользователей с настройками уведомлений
  const { data: users, error: usersError } = await supabase
    .from('notification_settings')
    .select(`
      user_id,
      email_frequency,
      notification_types,
      users!inner(email)
    `)
    .eq('notification_types->position_changes', true)

  if (usersError) {
    console.error('Error getting users for notifications:', usersError)
    return
  }

  for (const user of users) {
    try {
      // Получаем отслеживаемые подкасты пользователя
      const { data: userPodcasts, error: podcastsError } = await supabase
        .from('user_podcasts')
        .select(`
          podcast_id,
          podcasts!inner(title, source, source_id)
        `)
        .eq('user_id', user.user_id)

      if (podcastsError) {
        console.error(`Error getting podcasts for user ${user.user_id}:`, podcastsError)
        continue
      }

      // Проверяем изменения позиций для каждого подкаста
      const positionChanges: PositionChange[] = []
      
      for (const userPodcast of userPodcasts) {
        const changes = await checkPodcastPositionChanges(
          userPodcast.podcast_id,
          userPodcast.podcasts?.[0]?.source || 'unknown',
          userPodcast.podcasts?.[0]?.source_id || ''
        )
        positionChanges.push(...changes)
      }

      // Отправляем уведомления если есть изменения
      if (positionChanges.length > 0) {
        await sendPositionChangeNotification(
          user.users?.[0]?.email || '',
          positionChanges,
          user.email_frequency
        )
      }

    } catch (error) {
      console.error(`Error processing notifications for user ${user.user_id}:`, error)
    }
  }
}

// Проверка изменений позиций для конкретного подкаста
async function checkPodcastPositionChanges(
  podcastId: string,
  source: 'spotify' | 'apple',
  sourceId: string
): Promise<PositionChange[]> {
  const supabase = createServiceRoleClient()
  
  // Получаем последние 2 позиции для каждого подкаста
  const { data: recentPositions, error } = await supabase
    .from('charts')
    .select('position, platform, category, date, podcasts!inner(title)')
    .eq('podcast_id', podcastId)
    .eq('platform', source)
    .order('date', { ascending: false })
    .limit(2)

  if (error || !recentPositions || recentPositions.length < 2) {
    return []
  }

  const [current, previous] = recentPositions
  const change = previous.position - current.position // positive = moved up

  // Отправляем уведомление только если изменение значительное (3+ позиций)
  if (Math.abs(change) >= 3) {
    return [{
      podcast_id: podcastId,
      podcast_title: current.podcasts?.[0]?.title || 'Unknown',
      old_position: previous.position,
      new_position: current.position,
      change,
      platform: source,
      category: current.category,
      date: current.date
    }]
  }

  return []
}

// Отправка email уведомления об изменениях позиций
async function sendPositionChangeNotification(
  email: string,
  changes: PositionChange[],
  frequency: string
): Promise<void> {
  try {
    const subject = `Podcast Position Changes - ${changes.length} update${changes.length > 1 ? 's' : ''}`
    
    // Группируем изменения по типу
    const improvements = changes.filter(c => c.change > 0)
    const declines = changes.filter(c => c.change < 0)

    let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">📈 Podcast Position Updates</h2>
        <p>Here are the latest changes to your tracked podcasts:</p>
    `

    if (improvements.length > 0) {
      htmlContent += `
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="color: #059669; margin: 0 0 10px 0;">🚀 Improvements</h3>
          ${improvements.map((change: PositionChange) => `
            <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 5px;">
              <strong>${change.podcast_title}</strong><br>
              <span style="color: #059669;">
                ${change.old_position} → ${change.new_position} 
                (+${change.change} positions)
              </span><br>
              <small style="color: #666;">
                ${change.platform} • ${change.category} • ${change.date}
              </small>
            </div>
          `).join('')}
        </div>
      `
    }

    if (declines.length > 0) {
      htmlContent += `
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="color: #dc2626; margin: 0 0 10px 0;">📉 Declines</h3>
          ${declines.map((change: PositionChange) => `
            <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 5px;">
              <strong>${change.podcast_title}</strong><br>
              <span style="color: #dc2626;">
                ${change.old_position} → ${change.new_position} 
                (${change.change} positions)
              </span><br>
              <small style="color: #666;">
                ${change.platform} • ${change.category} • ${change.date}
              </small>
            </div>
          `).join('')}
        </div>
      `
    }

    htmlContent += `
        <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-radius: 8px;">
          <p style="margin: 0; color: #64748b;">
            <strong>💡 Pro Tip:</strong> Check your podcast's performance regularly and consider 
            analyzing what your competitors are doing differently.
          </p>
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background-color: #3b82f6; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            View Dashboard
          </a>
        </div>
      </div>
    `

    await sendEmail({
      to: email,
      subject,
      html: htmlContent
    })

    console.log(`Position change notification sent to ${email}`)
  } catch (error) {
    console.error(`Error sending position change notification to ${email}:`, error)
  }
}

// Отправка приветственного email
export async function sendWelcomeEmail(userId: string): Promise<void> {
  try {
    const supabase = createServiceRoleClient()
    
    const { data: user, error } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (error || !user) {
      console.error('Error getting user for welcome email:', error)
      return
    }

    await sendEmail({
      to: user.email,
      subject: 'Добро пожаловать в Podcast Tracker!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🎉 Добро пожаловать в Podcast Tracker!</h2>
          <p>Спасибо за регистрацию! Теперь вы можете:</p>
          <ul>
            <li>📊 Отслеживать позиции ваших подкастов в чартах</li>
            <li>🤖 Получать AI-анализ причин изменений</li>
            <li>🔔 Настраивать уведомления о росте</li>
            <li>📈 Анализировать конкурентов</li>
          </ul>
          <div style="margin-top: 20px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background-color: #3b82f6; color: white; padding: 10px 20px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Начать работу
            </a>
          </div>
        </div>
      `
    })

    console.log(`Welcome email sent to ${user.email}`)
  } catch (error) {
    console.error('Error sending welcome email:', error)
  }
}

// Планировщик уведомлений (вызывается cron job)
export async function processScheduledNotifications(): Promise<void> {
  console.log('Processing scheduled notifications...')
  
  try {
    await checkPositionChanges()
    console.log('Scheduled notifications processed successfully')
  } catch (error) {
    console.error('Error processing scheduled notifications:', error)
  }
}