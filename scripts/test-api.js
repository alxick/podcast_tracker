#!/usr/bin/env node

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'

// Тестовые данные
const TEST_USER = {
  email: 'test@podcasttracker.com',
  password: 'testpassword123'
}

const TEST_PODCAST = {
  source: 'spotify',
  source_id: '4rOoJ6Egrf8K2IrywzwOMk', // Joe Rogan Experience
  title: 'The Joe Rogan Experience',
  author: 'Joe Rogan',
  description: 'The Joe Rogan Experience podcast is a long form conversation hosted by comedian Joe Rogan with friends and guests that have included comedians, actors, musicians, MMA fighters, authors, artists, and beyond.',
  image_url: 'https://i.scdn.co/image/ab6765630000ba8a81f07e1ead0317ee3c285bfa',
  category: 'Comedy',
  rss_url: 'https://feeds.megaphone.fm/PPY8437510291'
}

// Утилиты для тестирования
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })
  
  const data = await response.json()
  return { response, data }
}

async function testAuth() {
  console.log('\n🔐 Тестирование аутентификации...')
  
  try {
    // Тест регистрации
    console.log('  - Регистрация пользователя...')
    const { response: signupResponse, data: signupData } = await makeRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(TEST_USER)
    })
    
    if (signupResponse.ok) {
      console.log('  ✅ Регистрация успешна')
    } else {
      console.log('  ⚠️  Регистрация:', signupData.error || 'Неизвестная ошибка')
    }
    
    // Тест входа
    console.log('  - Вход в систему...')
    const { response: signinResponse, data: signinData } = await makeRequest('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify(TEST_USER)
    })
    
    if (signinResponse.ok) {
      console.log('  ✅ Вход успешен')
      return signinData.session?.access_token
    } else {
      console.log('  ❌ Вход не удался:', signinData.error || 'Неизвестная ошибка')
      return null
    }
  } catch (error) {
    console.log('  ❌ Ошибка аутентификации:', error.message)
    return null
  }
}

async function testSearch(token) {
  console.log('\n🔍 Тестирование поиска подкастов...')
  
  try {
    const { response, data } = await makeRequest('/api/podcasts/search?q=joe rogan&platform=spotify&limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok && data.results && data.results.length > 0) {
      console.log('  ✅ Поиск работает, найдено подкастов:', data.results.length)
      return data.results[0]
    } else {
      console.log('  ❌ Поиск не работает:', data.error || 'Неизвестная ошибка')
      return null
    }
  } catch (error) {
    console.log('  ❌ Ошибка поиска:', error.message)
    return null
  }
}

async function testPodcastTracking(token, podcast) {
  console.log('\n📊 Тестирование отслеживания подкастов...')
  
  try {
    // Добавление подкаста
    console.log('  - Добавление подкаста в отслеживание...')
    const { response: addResponse, data: addData } = await makeRequest('/api/user/podcasts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ podcastId: podcast.id })
    })
    
    if (addResponse.ok) {
      console.log('  ✅ Подкаст добавлен в отслеживание')
    } else {
      console.log('  ❌ Не удалось добавить подкаст:', addData.error || 'Неизвестная ошибка')
    }
    
    // Получение отслеживаемых подкастов
    console.log('  - Получение списка отслеживаемых подкастов...')
    const { response: getResponse, data: getData } = await makeRequest('/api/user/podcasts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (getResponse.ok && getData.podcasts) {
      console.log('  ✅ Получен список подкастов, количество:', getData.podcasts.length)
    } else {
      console.log('  ❌ Не удалось получить список подкастов:', getData.error || 'Неизвестная ошибка')
    }
    
  } catch (error) {
    console.log('  ❌ Ошибка отслеживания:', error.message)
  }
}

async function testCharts(token) {
  console.log('\n📈 Тестирование чартов...')
  
  try {
    const { response, data } = await makeRequest('/api/charts?platform=spotify&category=1310&limit=10&country=US', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok && data.charts && data.charts.length > 0) {
      console.log('  ✅ Чарты загружены, количество:', data.charts.length)
    } else {
      console.log('  ❌ Не удалось загрузить чарты:', data.error || 'Неизвестная ошибка')
    }
  } catch (error) {
    console.log('  ❌ Ошибка загрузки чартов:', error.message)
  }
}

async function testAIAnalysis(token, podcast) {
  console.log('\n🤖 Тестирование AI анализа...')
  
  try {
    // Анализ обложки
    console.log('  - Анализ обложки подкаста...')
    const { response: coverResponse, data: coverData } = await makeRequest('/api/ai/analyze-cover', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        imageUrl: podcast.image_url,
        podcastTitle: podcast.title
      })
    })
    
    if (coverResponse.ok && coverData.analysis) {
      console.log('  ✅ Анализ обложки выполнен')
    } else {
      console.log('  ❌ Не удалось проанализировать обложку:', coverData.error || 'Неизвестная ошибка')
    }
    
    // Анализ причин изменений
    console.log('  - Анализ причин изменений позиций...')
    const { response: analysisResponse, data: analysisData } = await makeRequest('/api/ai/analyze-position-changes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ podcastId: podcast.id })
    })
    
    if (analysisResponse.ok && analysisData.analysis) {
      console.log('  ✅ Анализ причин изменений выполнен')
    } else {
      console.log('  ❌ Не удалось проанализировать причины изменений:', analysisData.error || 'Неизвестная ошибка')
    }
    
  } catch (error) {
    console.log('  ❌ Ошибка AI анализа:', error.message)
  }
}

async function testUserLimits(token) {
  console.log('\n📊 Тестирование лимитов пользователя...')
  
  try {
    const { response, data } = await makeRequest('/api/user/limits', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok && data.limits) {
      console.log('  ✅ Лимиты получены:')
      console.log(`    - План: ${data.limits.plan}`)
      console.log(`    - Отслеживаемых подкастов: ${data.limits.podcasts_tracked}/${data.limits.max_podcasts}`)
      console.log(`    - AI анализов: ${data.limits.ai_analyses_used}/${data.limits.max_ai_analyses}`)
    } else {
      console.log('  ❌ Не удалось получить лимиты:', data.error || 'Неизвестная ошибка')
    }
  } catch (error) {
    console.log('  ❌ Ошибка получения лимитов:', error.message)
  }
}

// Основная функция тестирования
async function runTests() {
  console.log('🚀 Запуск тестирования Podcast Tracker API...')
  console.log(`📍 Базовый URL: ${BASE_URL}`)
  
  // Тест аутентификации
  const token = await testAuth()
  if (!token) {
    console.log('\n❌ Тестирование прервано: не удалось аутентифицироваться')
    return
  }
  
  // Тест поиска
  const podcast = await testSearch(token)
  if (!podcast) {
    console.log('\n❌ Тестирование прервано: не удалось найти подкаст')
    return
  }
  
  // Остальные тесты
  await testPodcastTracking(token, podcast)
  await testCharts(token)
  await testAIAnalysis(token, podcast)
  await testUserLimits(token)
  
  console.log('\n✅ Тестирование завершено!')
}

// Запуск тестов
runTests().catch(console.error)
