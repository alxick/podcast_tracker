'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Country {
  code: string
  name: string
  flag: string
}

const countries: Country[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
]

interface CountrySelectorProps {
  value: string
  onChange: (country: string) => void
  platform: 'apple' | 'spotify'
  className?: string
}

export function CountrySelector({ value, onChange, platform, className = '' }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const selectedCountry = countries.find(c => c.code === value) || countries[0]
  
  // Для Apple Podcasts используем строчные коды, для Spotify - заглавные
  const formatCountryCode = (code: string) => {
    return platform === 'apple' ? code.toLowerCase() : code
  }
  
  const handleSelect = (country: Country) => {
    onChange(formatCountryCode(country.code))
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">{selectedCountry.flag}</span>
          <span>{selectedCountry.name}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {countries.map((country: { code: string; name: string; flag: string }) => (
            <button
              key={country.code}
              type="button"
              onClick={() => handleSelect(country)}
              className={`flex items-center space-x-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-100 ${
                value === formatCountryCode(country.code) ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
              }`}
            >
              <span className="text-lg">{country.flag}</span>
              <span>{country.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
