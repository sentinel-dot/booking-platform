'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedBusiness, setSelectedBusiness] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Set first business as default
    if (session.user.businesses.length > 0 && !selectedBusiness) {
      setSelectedBusiness(session.user.businesses[0].id)
    }
  }, [session, status, router, selectedBusiness])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Laden...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const currentBusiness = session.user.businesses.find(b => b.id === selectedBusiness)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                📅 Booking Dashboard
              </h1>
              
              {/* Business Selector */}
              {session.user.businesses.length > 1 && (
                <div className="ml-8">
                  <select
                    value={selectedBusiness || ''}
                    onChange={(e) => setSelectedBusiness(parseInt(e.target.value))}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {session.user.businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {session.user.firstName} {session.user.lastName}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Current Business Info */}
      {currentBusiness && (
        <div className="bg-blue-50 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-blue-900">
                  {currentBusiness.name}
                </h2>
                <p className="text-sm text-blue-700">
                  {currentBusiness.type === 'restaurant' ? '🍽️ Restaurant' : '💇 Friseursalon'}
                  {' • '}
                  {currentBusiness.role}
                </p>
              </div>
              {/* TODO: Add booking slug to business data */}
              <div className="text-sm text-blue-600">
                🔗 Buchungsseite: /book/{currentBusiness.name.toLowerCase().replace(/\s+/g, '-')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar & Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              <Link
                href="/dashboard"
                className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
              >
                📊 Übersicht
              </Link>
              <Link
                href="/dashboard/bookings"
                className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
              >
                📅 Buchungen
              </Link>
              <Link
                href="/dashboard/services"
                className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
              >
                🛎️ Services
              </Link>
              {currentBusiness?.type === 'hair_salon' && (
                <Link
                  href="/dashboard/staff"
                  className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                >
                  👥 Mitarbeiter
                </Link>
              )}
              <Link
                href="/dashboard/settings"
                className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
              >
                ⚙️ Einstellungen
              </Link>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {selectedBusiness ? children : (
              <div className="text-center py-12">
                <p className="text-gray-500">Wählen Sie ein Business aus</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}