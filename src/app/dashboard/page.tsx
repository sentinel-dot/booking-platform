'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { format, isToday, isTomorrow } from 'date-fns'
import { de } from 'date-fns/locale'

interface TodaysBooking {
  id: number
  customerName: string
  customerEmail: string
  customerPhone: string
  service: { name: string }
  staffMember?: { name: string }
  startTime: string
  endTime: string
  status: string
  partySize: number
  specialRequests?: string
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [todaysBookings, setTodaysBookings] = useState<TodaysBooking[]>([])
  const [stats, setStats] = useState({
    todayBookings: 0,
    tomorrowBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const selectedBusiness = session?.user.businesses[0] // Simplified for now

  useEffect(() => {
    if (selectedBusiness) {
      loadDashboardData()
    }
  }, [selectedBusiness])

  const loadDashboardData = async () => {
    try {
      // This would be a real API call
      // For now, we'll simulate the data
      setStats({
        todayBookings: 8,
        tomorrowBookings: 12,
        pendingBookings: 3,
        totalRevenue: 750,
      })

      // Simulate today's bookings
      const mockBookings: TodaysBooking[] = [
        {
          id: 1,
          customerName: 'Max Mustermann',
          customerEmail: 'max@example.com',
          customerPhone: '+49 170 1234567',
          service: { name: 'Herrenhaarschnitt' },
          staffMember: { name: 'Klaus Meyer' },
          startTime: '09:00',
          endTime: '09:45',
          status: 'confirmed',
          partySize: 1,
        },
        {
          id: 2,
          customerName: 'Anna Schmidt',
          customerEmail: 'anna@example.com',
          customerPhone: '+49 170 7654321',
          service: { name: 'Tisch für 4 Personen' },
          startTime: '19:00',
          endTime: '21:00',
          status: 'pending',
          partySize: 4,
          specialRequests: 'Fensterplatz gewünscht',
        },
      ]

      setTodaysBookings(mockBookings)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    }
    
    const labels = {
      pending: 'Ausstehend',
      confirmed: 'Bestätigt',
      cancelled: 'Storniert',
      completed: 'Abgeschlossen',
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">Lade Dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Übersicht</h1>
        <p className="text-gray-600">
          Willkommen zurück, {session?.user.firstName}! Hier ist Ihre heutige Übersicht.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Heute</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.todayBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">
              <span className="text-2xl">📆</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Morgen</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.tomorrowBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-md">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ausstehend</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Umsatz heute</p>
              <p className="text-2xl font-semibold text-gray-900">€{stats.totalRevenue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Bookings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Heutige Termine</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {todaysBookings.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">Keine Termine für heute</p>
            </div>
          ) : (
            todaysBookings.map((booking) => (
              <div key={booking.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.startTime} - {booking.endTime}
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="mt-1">
                      <p className="text-sm font-medium text-gray-900">
                        {booking.customerName}
                        {booking.partySize > 1 && (
                          <span className="text-gray-500 ml-2">
                            ({booking.partySize} Personen)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">{booking.service.name}</p>
                      {booking.staffMember && (
                        <p className="text-sm text-gray-500">mit {booking.staffMember.name}</p>
                      )}
                    </div>
                    {booking.specialRequests && (
                      <p className="text-xs text-gray-500 mt-1">
                        Wunsch: {booking.specialRequests}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:${booking.customerEmail}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      📧
                    </a>
                    {booking.customerPhone && (
                      <a
                        href={`tel:${booking.customerPhone}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        📞
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Schnellaktionen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <div className="text-2xl mb-2">➕</div>
            <div className="font-medium text-gray-900">Neue Buchung</div>
            <div className="text-sm text-gray-500">Manuell hinzufügen</div>
          </button>
          
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium text-gray-900">Berichte</div>
            <div className="text-sm text-gray-500">Statistiken ansehen</div>
          </button>
          
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <div className="text-2xl mb-2">📧</div>
            <div className="font-medium text-gray-900">Benachrichtigungen</div>
            <div className="text-sm text-gray-500">Kunden kontaktieren</div>
          </button>
        </div>
      </div>
    </div>
  )
}