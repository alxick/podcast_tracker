import sgMail from '@sendgrid/mail'

// Настройка SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  text?: string
}

// Отправка email
export async function sendEmail(template: EmailTemplate) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured, email not sent')
    return { success: false, error: 'SendGrid not configured' }
  }

  if (!template.to || !template.subject) {
    console.warn('Invalid email template: missing to or subject')
    return { success: false, error: 'Invalid email template' }
  }

  try {
    const msg = {
      to: template.to,
      from: process.env.FROM_EMAIL || 'noreply@podcasttracker.com',
      subject: template.subject,
      html: template.html,
      text: template.text,
    }

    await sgMail.send(msg)
    console.log('Email sent successfully to:', template.to)
    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Шаблоны email
export const emailTemplates = {
  // Ежедневный дайджест
  dailyDigest: (userEmail: string, data: {
    podcasts: Array<{
      title: string
      positionChange: number
      newEpisodes: number
    }>
  }) => ({
    to: userEmail,
    subject: '📊 Ежедневный дайджест Podcast Tracker',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">📊 Ежедневный дайджест</h1>
        <p>Вот что произошло с вашими подкастами за последние 24 часа:</p>
        
        ${data.podcasts.map(podcast => `
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937;">${podcast.title}</h3>
            ${podcast.positionChange !== 0 ? `
              <p style="margin: 4px 0; color: ${podcast.positionChange > 0 ? '#dc2626' : '#16a34a'};">
                📈 Позиция в чарте: ${podcast.positionChange > 0 ? '+' : ''}${podcast.positionChange}
              </p>
            ` : ''}
            ${podcast.newEpisodes > 0 ? `
              <p style="margin: 4px 0; color: #3b82f6;">
                🎧 Новых эпизодов: ${podcast.newEpisodes}
              </p>
            ` : ''}
          </div>
        `).join('')}
        
        <div style="margin-top: 24px; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            Хотите изменить настройки уведомлений? 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/notifications" style="color: #3b82f6;">Перейти в настройки</a>
          </p>
        </div>
      </div>
    `,
    text: `Ежедневный дайджест Podcast Tracker\n\n${data.podcasts.map(p => 
      `${p.title}: позиция ${p.positionChange > 0 ? '+' : ''}${p.positionChange}, новых эпизодов: ${p.newEpisodes}`
    ).join('\n')}`
  }),

  // Уведомление о значительном изменении позиции
  positionAlert: (userEmail: string, data: {
    podcastTitle: string
    oldPosition: number
    newPosition: number
    change: number
  }) => ({
    to: userEmail,
    subject: `🚨 ${data.change > 0 ? 'Рост' : 'Падение'} подкаста "${data.podcastTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: ${data.change > 0 ? '#dc2626' : '#16a34a'};">
          ${data.change > 0 ? '📈 Рост' : '📉 Падение'} подкаста
        </h1>
        
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h2 style="margin: 0 0 16px 0; color: #1f2937;">${data.podcastTitle}</h2>
          
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #6b7280;">${data.oldPosition}</div>
              <div style="font-size: 12px; color: #6b7280;">было</div>
            </div>
            
            <div style="font-size: 24px; color: ${data.change > 0 ? '#dc2626' : '#16a34a'};">
              ${data.change > 0 ? '→' : '←'}
            </div>
            
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${data.newPosition}</div>
              <div style="font-size: 12px; color: #6b7280;">стало</div>
            </div>
          </div>
          
          <div style="margin-top: 16px; padding: 12px; background-color: ${data.change > 0 ? '#fef2f2' : '#f0fdf4'}; border-radius: 6px;">
            <p style="margin: 0; color: ${data.change > 0 ? '#dc2626' : '#16a34a'}; font-weight: bold;">
              ${data.change > 0 ? '📈' : '📉'} Изменение: ${data.change > 0 ? '+' : ''}${data.change} позиций
            </p>
          </div>
        </div>
        
        <div style="margin-top: 24px; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/podcast/${data.podcastTitle}" style="color: #3b82f6;">Посмотреть детали подкаста</a>
          </p>
        </div>
      </div>
    `,
    text: `${data.change > 0 ? 'Рост' : 'Падение'} подкаста "${data.podcastTitle}": ${data.oldPosition} → ${data.newPosition} (${data.change > 0 ? '+' : ''}${data.change})`
  }),

  // Уведомление о новом эпизоде
  newEpisode: (userEmail: string, data: {
    podcastTitle: string
    episodeTitle: string
    publishedAt: string
  }) => ({
    to: userEmail,
    subject: `🎧 Новый эпизод "${data.episodeTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">🎧 Новый эпизод</h1>
        
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h2 style="margin: 0 0 8px 0; color: #1f2937;">${data.episodeTitle}</h2>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${data.podcastTitle}</p>
          <p style="margin: 0; color: #6b7280; font-size: 12px;">Опубликован: ${new Date(data.publishedAt).toLocaleDateString('ru-RU')}</p>
        </div>
        
        <div style="margin-top: 24px; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/podcast/${data.podcastTitle}" style="color: #3b82f6;">Посмотреть подкаст</a>
          </p>
        </div>
      </div>
    `,
    text: `Новый эпизод "${data.episodeTitle}" в подкасте "${data.podcastTitle}"`
  }),

  // Приветственное письмо
  welcome: (userEmail: string) => ({
    to: userEmail,
    subject: '🎉 Добро пожаловать в Podcast Tracker!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">🎉 Добро пожаловать в Podcast Tracker!</h1>
        
        <p>Спасибо за регистрацию! Теперь вы можете:</p>
        
        <ul style="color: #374151;">
          <li>🔍 Искать и отслеживать подкасты</li>
          <li>📊 Мониторить позиции в чартах</li>
          <li>🤖 Анализировать обложки с помощью AI</li>
          <li>🔔 Получать уведомления о важных изменениях</li>
        </ul>
        
        <div style="margin: 24px 0; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/search" 
             style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">
            Начать отслеживание
          </a>
        </div>
        
        <div style="margin-top: 24px; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            Нужна помощь? <a href="mailto:support@podcasttracker.com" style="color: #3b82f6;">Свяжитесь с нами</a>
          </p>
        </div>
      </div>
    `,
    text: 'Добро пожаловать в Podcast Tracker! Начните отслеживать свои подкасты.'
  })
}
