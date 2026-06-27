'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Radar, Eye, ListChecks, BarChart3 } from 'lucide-react'

const links = [
  { href: '/', label: 'Deck', icon: Radar },
  { href: '/scanner', label: 'Scanner', icon: Eye },
  { href: '/watchlist', label: 'Watchlist', icon: ListChecks },
  { href: '/dashboard', label: 'Performance', icon: BarChart3 },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-white">Polymarket Signal Desk</span>
          </Link>
          <nav className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
