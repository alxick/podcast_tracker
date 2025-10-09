import { createServiceRoleClient } from '@/lib/supabase/server'

// Сброс счетчиков AI анализов для платных планов
export async function resetMonthlyCounters() {
  console.log('Starting monthly counters reset...')
  
  try {
    const supabase = createServiceRoleClient()
    
    // Сбрасываем счетчики AI анализов для платных планов
    const { error: resetError } = await supabase
      .from('users')
      .update({ 
        ai_analyses_used: 0,
        charts_accessed: 0
      })
      .in('plan', ['starter', 'pro', 'agency'])
    
    if (resetError) {
      console.error('Error resetting monthly counters:', resetError)
      return
    }
    
    console.log('Monthly counters reset completed successfully')
  } catch (error) {
    console.error('Error in monthly counters reset:', error)
  }
}

// Сброс счетчиков для конкретного пользователя
export async function resetUserCounters(userId: string) {
  try {
    const supabase = createServiceRoleClient()
    
    // Получаем план пользователя
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .single()
    
    if (userError || !user) {
      console.error('Error getting user plan:', userError)
      return
    }
    
    // Сбрасываем счетчики только для платных планов
    if (['starter', 'pro', 'agency'].includes(user.plan)) {
      const { error: resetError } = await supabase
        .from('users')
        .update({ 
          ai_analyses_used: 0,
          charts_accessed: 0
        })
        .eq('id', userId)
      
      if (resetError) {
        console.error('Error resetting user counters:', resetError)
        return
      }
      
      console.log(`Counters reset for user ${userId}`)
    }
  } catch (error) {
    console.error('Error resetting user counters:', error)
  }
}

// Проверка, нужно ли сбросить счетчики
export async function shouldResetCounters(): Promise<boolean> {
  try {
    const supabase = createServiceRoleClient()
    
    // Получаем дату последнего сброса
    const { data: lastReset, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'last_counters_reset')
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking last reset date:', error)
      return false
    }
    
    if (!lastReset) {
      // Первый запуск - создаем запись
      await supabase
        .from('system_settings')
        .insert({
          key: 'last_counters_reset',
          value: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
      return true
    }
    
    const lastResetDate = new Date(lastReset.value)
    const now = new Date()
    const daysSinceReset = Math.floor((now.getTime() - lastResetDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Сбрасываем каждые 30 дней
    return daysSinceReset >= 30
  } catch (error) {
    console.error('Error checking reset date:', error)
    return false
  }
}

// Обновление даты последнего сброса
export async function updateLastResetDate() {
  try {
    const supabase = createServiceRoleClient()
    
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: 'last_counters_reset',
        value: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error updating last reset date:', error)
    }
  } catch (error) {
    console.error('Error updating last reset date:', error)
  }
}

// Основная функция сброса счетчиков
export async function runMonthlyReset() {
  console.log('Starting monthly reset process...')
  
  try {
    const shouldReset = await shouldResetCounters()
    
    if (shouldReset) {
      await resetMonthlyCounters()
      await updateLastResetDate()
      console.log('Monthly reset completed successfully')
    } else {
      console.log('Monthly reset not needed yet')
    }
  } catch (error) {
    console.error('Error in monthly reset:', error)
  }
}
