#!/usr/bin/env node

const https = require('https')
const http = require('http')

const BASE_URL = process.env.CRON_URL || 'http://localhost:3000/api/cron'
const CRON_SECRET = process.env.CRON_SECRET_TOKEN

if (!CRON_SECRET) {
  console.error('CRON_SECRET_TOKEN not configured')
  process.exit(1)
}

// Получаем тип задачи из аргументов командной строки
const taskType = process.argv[2] || 'update'

const TASK_URLS = {
  'update': '/update',
  'charts': '/charts',
  'episodes': '/episodes',
  'notifications': '/notifications'
}

const CRON_URL = `${BASE_URL}${TASK_URLS[taskType] || TASK_URLS.update}`

async function runCronJob() {
  try {
    console.log(`Running cron job: ${taskType}...`)
    console.log(`URL: ${CRON_URL}`)
    
    const url = new URL(CRON_URL)
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    }
    
    const client = url.protocol === 'https:' ? https : http
    
    const req = client.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`${taskType} cron job completed successfully`)
          console.log('Response:', data)
        } else {
          console.error(`${taskType} cron job failed with status:`, res.statusCode)
          console.error('Response:', data)
          process.exit(1)
        }
      })
    })
    
    req.on('error', (error) => {
      console.error(`Error running ${taskType} cron job:`, error)
      process.exit(1)
    })
    
    req.end()
  } catch (error) {
    console.error(`${taskType} cron job error:`, error)
    process.exit(1)
  }
}

// Запускаем cron job
runCronJob()
