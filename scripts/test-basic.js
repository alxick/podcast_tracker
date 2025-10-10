#!/usr/bin/env node

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'

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

async function testSearch() {
  console.log('\n🔍 Тестирование поиска подкастов...')
  
  try {
    const { response, data } = await makeRequest('/api/podcasts/search?q=joe rogan&platform=spotify&limit=5')
    
    if (response.ok && data.results && data.results.length > 0) {
      console.log('  ✅ Поиск работает, найдено подкастов:', data.results.length)
      console.log('  📝 Первый результат:', data.results[0].title)
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

async function testCharts() {
  console.log('\n📈 Тестирование чартов...')
  
  try {
    const { response, data } = await makeRequest('/api/charts?platform=spotify&category=1310&limit=10&country=US')
    
    if (response.ok && data.charts && data.charts.length > 0) {
      console.log('  ✅ Чарты загружены, количество:', data.charts.length)
      console.log('  📝 Первый в чарте:', data.charts[0].title)
    } else {
      console.log('  ❌ Не удалось загрузить чарты:', data.error || 'Неизвестная ошибка')
    }
  } catch (error) {
    console.log('  ❌ Ошибка загрузки чартов:', error.message)
  }
}

async function testPodcastDetails(podcast) {
  console.log('\n📊 Тестирование деталей подкаста...')
  
  try {
    const { response, data } = await makeRequest(`/api/podcasts/${podcast.id}?episodes=true`)
    
    if (response.ok && data.podcast) {
      console.log('  ✅ Детали подкаста загружены')
      console.log('  📝 Название:', data.podcast.title)
      console.log('  📝 Автор:', data.podcast.author)
      if (data.episodes) {
        console.log('  📝 Эпизодов:', data.episodes.length)
      }
    } else {
      console.log('  ❌ Не удалось загрузить детали подкаста:', data.error || 'Неизвестная ошибка')
    }
  } catch (error) {
    console.log('  ❌ Ошибка загрузки деталей подкаста:', error.message)
  }
}

async function testAIAnalysis(podcast) {
  console.log('\n🤖 Тестирование AI анализа...')
  
  try {
    // Анализ обложки
    console.log('  - Анализ обложки подкаста...')
    const { response: coverResponse, data: coverData } = await makeRequest('/api/ai/analyze-cover', {
      method: 'POST',
      body: JSON.stringify({
        imageUrl: podcast.image_url,
        podcastTitle: podcast.title
      })
    })
    
    if (coverResponse.ok && coverData.analysis) {
      console.log('  ✅ Анализ обложки выполнен')
      console.log('  📝 Доминирующий цвет:', coverData.analysis.colors?.dominant)
      console.log('  📝 Рекомендаций:', coverData.analysis.recommendations?.length || 0)
    } else {
      console.log('  ❌ Не удалось проанализировать обложку:', coverData.error || 'Неизвестная ошибка')
    }
    
  } catch (error) {
    console.log('  ❌ Ошибка AI анализа:', error.message)
  }
}

async function testChartHistory(podcast) {
  console.log('\n📊 Тестирование истории чартов...')
  
  try {
    // Сначала получаем детали подкаста, чтобы получить правильный ID из БД
    const { response: detailsResponse, data: detailsData } = await makeRequest(`/api/podcasts/${podcast.source_id}`)
    
    if (!detailsResponse.ok || !detailsData.podcast) {
      console.log('  ❌ Не удалось получить детали подкаста для истории чартов')
      return
    }
    
    const dbPodcastId = detailsData.podcast.id
    const { response, data } = await makeRequest(`/api/charts/${dbPodcastId}/history?days=30`)
    
    if (response.ok && data.history) {
      console.log('  ✅ История чартов загружена')
      console.log('  📝 Записей в истории:', data.history.length)
    } else {
      console.log('  ❌ Не удалось загрузить историю чартов:', data.error || 'Неизвестная ошибка')
    }
  } catch (error) {
    console.log('  ❌ Ошибка загрузки истории чартов:', error.message)
  }
}

// Основная функция тестирования
async function runTests() {
  console.log('🚀 Запуск базового тестирования Podcast Tracker API...')
  console.log(`📍 Базовый URL: ${BASE_URL}`)
  
  // Тест поиска
  const podcast = await testSearch()
  if (!podcast) {
    console.log('\n❌ Тестирование прервано: не удалось найти подкаст')
    return
  }
  
  // Остальные тесты
  await testCharts()
  await testPodcastDetails(podcast)
  await testAIAnalysis(podcast)
  await testChartHistory(podcast)
  
  console.log('\n✅ Базовое тестирование завершено!')
}

// Запуск тестов
runTests().catch(console.error)
