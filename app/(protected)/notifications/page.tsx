'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell, 
  Mail, 
  Clock, 
  TrendingUp, 
  Users, 
  BarChart3,
  CheckCircle
} from 'lucide-react'
import { NotificationSettings } from '@/lib/types/database'

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_frequency: settings.email_frequency,
          notification_types: settings.notification_types
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' })
      }
    } catch (error) {
      console.error('Error saving notification settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const updateFrequency = (frequency: 'instant' | 'daily' | 'weekly') => {
    if (settings) {
      setSettings({
        ...settings,
        email_frequency: frequency
      })
    }
  }

  const updateNotificationType = (type: keyof NotificationSettings['notification_types'], enabled: boolean) => {
    if (settings) {
      setSettings({
        ...settings,
        notification_types: {
          ...settings.notification_types,
          [type]: enabled
        }
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notification settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Failed to load notification settings. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Notification Settings
        </h1>
        <p className="text-gray-600">
          Configure how and when you receive notifications about your podcasts
        </p>
      </div>

      <div className="grid gap-6">
        {/* Message */}
        {message && (
          <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Email Frequency */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email Frequency</CardTitle>
            </div>
            <CardDescription>
              How often would you like to receive email notifications?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={settings.email_frequency} 
              onValueChange={updateFrequency}
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Instant
                  </div>
                </SelectItem>
                <SelectItem value="daily">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Daily Digest
                  </div>
                </SelectItem>
                <SelectItem value="weekly">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Weekly Summary
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notification Types</CardTitle>
            </div>
            <CardDescription>
              Choose which types of notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Position Changes */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <div>
                  <h3 className="font-medium">Position Changes</h3>
                  <p className="text-sm text-gray-500">
                    Get notified when your podcasts move up or down in charts
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.notification_types.position_changes}
                onCheckedChange={(checked) => updateNotificationType('position_changes', checked)}
              />
            </div>

            {/* New Episodes */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-green-500" />
                <div>
                  <h3 className="font-medium">New Episodes</h3>
                  <p className="text-sm text-gray-500">
                    Get notified when new episodes are published
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.notification_types.new_episodes}
                onCheckedChange={(checked) => updateNotificationType('new_episodes', checked)}
              />
            </div>

            {/* Competitor Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-purple-500" />
                <div>
                  <h3 className="font-medium">Competitor Actions</h3>
                  <p className="text-sm text-gray-500">
                    Get notified about what your competitors are doing
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.notification_types.competitor_actions}
                onCheckedChange={(checked) => updateNotificationType('competitor_actions', checked)}
              />
            </div>

            {/* Trends */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <div>
                  <h3 className="font-medium">Trending Topics</h3>
                  <p className="text-sm text-gray-500">
                    Get notified about trending topics in your niche
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.notification_types.trends}
                onCheckedChange={(checked) => updateNotificationType('trends', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={saveSettings}
            disabled={saving}
            className="min-w-32"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}