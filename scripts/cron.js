#!/usr/bin/env node

const https = require('https')
const http = require('http')

const CRON_URL = process.env.CRON_URL || 'http://localhost:3000/api/cron/update'
const CRON_SECRET = process.env.CRON_SECRET_TOKEN

if (!CRON_SECRET) {
  console.error('CRON_SECRET_TOKEN not configured')
  process.exit(1)
}

async function runCronJob() {
  try {
    console.log('Running cron job...')
    
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
          console.log('Cron job completed successfully')
          console.log('Response:', data)
        } else {
          console.error('Cron job failed with status:', res.statusCode)
          console.error('Response:', data)
        }
      })
    })
    
    req.on('error', (error) => {
      console.error('Error running cron job:', error)
    })
    
    req.end()
  } catch (error) {
    console.error('Cron job error:', error)
  }
}

// Запускаем cron job
runCronJob()
