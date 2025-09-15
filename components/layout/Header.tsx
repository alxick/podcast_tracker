'use client'

import { Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1"></div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Уведомления</span>
          </Button>
          
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
          
          <Button variant="ghost" size="sm">
            <User className="h-5 w-5" />
            <span className="sr-only">Профиль</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
