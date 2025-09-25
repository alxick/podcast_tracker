'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Podcast, 
  Brain, 
  BarChart3, 
  AlertTriangle, 
  Crown,
  Zap
} from 'lucide-react'

interface UsageLimitsProps {
  limits: {
    podcasts_tracked: number
    ai_analyses_used: number
    charts_accessed: number
    max_podcasts: number
    max_ai_analyses: number
    max_charts: number
    plan: string
  }
  onUpgrade?: () => void
}

export function UsageLimits({ limits, onUpgrade }: UsageLimitsProps) {
  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800'
      case 'starter': return 'bg-blue-100 text-blue-800'
      case 'pro': return 'bg-purple-100 text-purple-800'
      case 'agency': return 'bg-gold-100 text-gold-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'free': return <Podcast className="h-4 w-4" />
      case 'starter': return <Zap className="h-4 w-4" />
      case 'pro': return <Crown className="h-4 w-4" />
      case 'agency': return <Crown className="h-4 w-4" />
      default: return <Podcast className="h-4 w-4" />
    }
  }

  const getUsagePercentage = (used: number, max: number) => {
    if (max === 999999) return 0 // Unlimited
    return Math.min((used / max) * 100, 100)
  }

  const getUsageColor = (used: number, max: number) => {
    const percentage = getUsagePercentage(used, max)
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const isNearLimit = (used: number, max: number) => {
    if (max === 999999) return false // Unlimited
    return (used / max) >= 0.8
  }

  const isAtLimit = (used: number, max: number) => {
    if (max === 999999) return false // Unlimited
    return used >= max
  }

  const limitItems = [
    {
      name: 'Tracked Podcasts',
      used: limits.podcasts_tracked,
      max: limits.max_podcasts,
      icon: <Podcast className="h-5 w-5" />,
      description: 'Podcasts you\'re currently tracking'
    },
    {
      name: 'AI Analyses',
      used: limits.ai_analyses_used,
      max: limits.max_ai_analyses,
      icon: <Brain className="h-5 w-5" />,
      description: 'AI cover analyses this month'
    },
    {
      name: 'Chart Access',
      used: limits.charts_accessed,
      max: limits.max_charts,
      icon: <BarChart3 className="h-5 w-5" />,
      description: 'Chart views this month'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Plan Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getPlanIcon(limits.plan)}
              <CardTitle className="text-lg">
                {limits.plan.charAt(0).toUpperCase() + limits.plan.slice(1)} Plan
              </CardTitle>
            </div>
            <Badge className={getPlanColor(limits.plan)}>
              {limits.plan.toUpperCase()}
            </Badge>
          </div>
          <CardDescription>
            Your current subscription plan and usage limits
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Usage Limits */}
      <div className="grid gap-4 md:grid-cols-3">
        {limitItems.map((item: { name: string; used: number; max: number; icon: React.ReactElement; description: string }) => {
          const isUnlimited = item.max === 999999
          const percentage = getUsagePercentage(item.used, item.max)
          const nearLimit = isNearLimit(item.used, item.max)
          const atLimit = isAtLimit(item.used, item.max)

          return (
            <Card key={item.name} className={nearLimit ? 'border-yellow-200 bg-yellow-50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {item.icon}
                  <div>
                    <h3 className="font-medium text-sm">{item.name}</h3>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.used} {isUnlimited ? '' : `of ${item.max}`}
                    </span>
                    {isUnlimited ? (
                      <span className="text-green-600 font-medium">Unlimited</span>
                    ) : (
                      <span className="text-gray-500">
                        {Math.round(percentage)}%
                      </span>
                    )}
                  </div>

                  {!isUnlimited && (
                    <Progress 
                      value={percentage} 
                      className="h-2"
                    />
                  )}

                  {atLimit && (
                    <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Limit reached. Upgrade to continue.
                      </AlertDescription>
                    </Alert>
                  )}

                  {nearLimit && !atLimit && (
                    <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Approaching limit. Consider upgrading.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Upgrade Prompt */}
      {limits.plan !== 'agency' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">
                  Need more capacity?
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Upgrade your plan to unlock more features and higher limits.
                </p>
              </div>
              <Button 
                onClick={onUpgrade}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function LimitExceededModal({ 
  isOpen, 
  onClose, 
  limitType, 
  limits, 
  onUpgrade 
}: {
  isOpen: boolean
  onClose: () => void
  limitType: string
  limits: UsageLimitsProps['limits']
  onUpgrade?: () => void
}) {
  if (!isOpen) return null

  const getLimitMessage = (type: string) => {
    switch (type) {
      case 'track_podcast':
        return `You've reached the limit of ${limits.max_podcasts} tracked podcasts for your ${limits.plan} plan.`
      case 'ai_analysis':
        return `You've reached the limit of ${limits.max_ai_analyses} AI analyses for your ${limits.plan} plan.`
      case 'access_charts':
        return `You've reached the limit of ${limits.max_charts} chart accesses for your ${limits.plan} plan.`
      default:
        return 'You\'ve reached a usage limit for your current plan.'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700">Limit Exceeded</CardTitle>
          </div>
          <CardDescription>
            {getLimitMessage(limitType)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageLimits limits={limits} onUpgrade={onUpgrade} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
            {onUpgrade && (
              <Button onClick={onUpgrade} className="flex-1">
                Upgrade Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
