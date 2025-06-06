'use client'

import React, { useState } from 'react'
import { format, addDays, startOfToday } from 'date-fns'
import { de } from 'date-fns/locale'

interface Business {
  id: number
  name: string
  type: string
  services: Array<{
    id: number
    name: string
    description: string
    durationMinutes: number
    price: string | null
    capacity: number
    requiresStaff: boolean
  }>
  staffMembers: Array<{
    id: number
    name: string
    description: string
    services: Array<{
      id: number
      name: string
    }>
  }>
  settings: {
    bookingAdvanceDays: number
    cancellationHours: number
    requirePhone: boolean
    requireDeposit: boolean
  }
}

interface BookingFormData {
  serviceId: number | null
  staffMemberId: number | null
  date: string
  time: string
  partySize: number
  customerName: string
  customerEmail: string
  customerPhone: string
  specialRequests: string
}

export default function BookingForm({ business }: { business: Business }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<BookingFormData>({
    serviceId: null,
    staffMemberId: null,
    date: '',
    time: '',
    partySize: 1,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    specialRequests: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<Array<{ start_time: string; end_time: string; staff_member_id?: number; staff_name?: string }>>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Load available slots when date/service/staff changes
  const loadAvailableSlots = async () => {
    if (!formData.date || !formData.serviceId) return

    setLoadingSlots(true)
    try {
      const params = new URLSearchParams({
        business_id: business.id.toString(),
        date: formData.date,
        service_id: formData.serviceId.toString(),
        ...(formData.staffMemberId && { staff_id: formData.staffMemberId.toString() }),
      })

      const response = await fetch(`/api/availability?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.available_slots || [])
      } else {
        setAvailableSlots([])
      }
    } catch (error) {
      console.error('Error loading slots:', error)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  // Trigger slot loading when dependencies change
  React.useEffect(() => {
    loadAvailableSlots()
  }, [formData.date, formData.serviceId, formData.staffMemberId])

  // Get available dates (next 30 days, example)
  const availableDates = Array.from({ length: business.settings.bookingAdvanceDays }, (_, i) => {
    const date = addDays(startOfToday(), i + 1)
    return format(date, 'yyyy-MM-dd')
  })

  // Get example time slots (simplified for demo)
  const getTimeSlots = () => {
    return availableSlots.map(slot => slot.start_time)
  }

  const handleDateChange = (date: string) => {
    setFormData(prev => ({ 
      ...prev, 
      date, 
      time: '' // Reset time when date changes
    }))
  }

  const selectedService = business.services.find(s => s.id === formData.serviceId)
  const availableStaff = selectedService?.requiresStaff 
    ? business.staffMembers.filter(staff => 
        staff.services.some(service => service.id === formData.serviceId)
      )
    : []

  const handleServiceSelect = (serviceId: number) => {
    setFormData(prev => ({
      ...prev,
      serviceId,
      staffMemberId: null, // Reset staff when service changes
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_id: business.id,
          service_id: formData.serviceId,
          staff_member_id: formData.staffMemberId,
          customer_name: formData.customerName,
          customer_email: formData.customerEmail,
          customer_phone: formData.customerPhone,
          booking_date: formData.date,
          start_time: formData.time,
          party_size: formData.partySize,
          special_requests: formData.specialRequests,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Buchung erfolgreich! Buchungs-ID: ${result.booking.id}`)
        // Reset form or redirect
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Service Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          1. Service auswählen
        </h3>
        
        <div className="grid gap-3 md:grid-cols-2">
          {business.services.map((service) => (
            <div
              key={service.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                formData.serviceId === service.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleServiceSelect(service.id)}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="service"
                  value={service.id}
                  checked={formData.serviceId === service.id}
                  onChange={() => handleServiceSelect(service.id)}
                  className="h-4 w-4 text-blue-600"
                />
                <div className="ml-3 flex-1">
                  <h4 className="font-medium text-gray-900">{service.name}</h4>
                  <p className="text-sm text-gray-600">{service.description}</p>
                  <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                    <span>{service.durationMinutes} Min.</span>
                    {service.price && parseFloat(service.price) > 0 && (
                      <span className="font-medium">€{parseFloat(service.price).toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2: Staff Selection (if required) */}
      {selectedService?.requiresStaff && availableStaff.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            2. Mitarbeiter wählen
          </h3>
          
          <div className="grid gap-3 md:grid-cols-2">
            {availableStaff.map((staff) => (
              <div
                key={staff.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  formData.staffMemberId === staff.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, staffMemberId: staff.id }))}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="staff"
                    value={staff.id}
                    checked={formData.staffMemberId === staff.id}
                    onChange={() => setFormData(prev => ({ ...prev, staffMemberId: staff.id }))}
                    className="h-4 w-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">{staff.name}</h4>
                    <p className="text-sm text-gray-600">{staff.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Date & Time */}
      {formData.serviceId && (!selectedService?.requiresStaff || formData.staffMemberId) && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            3. Datum und Uhrzeit
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Datum
              </label>
              <select
                value={formData.date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Datum wählen</option>
                {availableDates.map((date) => (
                  <option key={date} value={date}>
                    {format(new Date(date), 'EEEE, dd.MM.yyyy', { locale: de })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uhrzeit
              </label>
              <select
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!formData.date || loadingSlots}
              >
                <option value="">
                  {loadingSlots ? 'Lade verfügbare Zeiten...' : 'Uhrzeit wählen'}
                </option>
                {!loadingSlots && getTimeSlots().map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
                {!loadingSlots && availableSlots.length === 0 && formData.date && (
                  <option disabled>Keine verfügbaren Zeiten</option>
                )}
              </select>
            </div>
          </div>

          {selectedService && selectedService.capacity > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anzahl Personen
              </label>
              <select
                value={formData.partySize}
                onChange={(e) => setFormData(prev => ({ ...prev, partySize: parseInt(e.target.value) }))}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: selectedService.capacity }, (_, i) => i + 1).map((size) => (
                  <option key={size} value={size}>
                    {size} {size === 1 ? 'Person' : 'Personen'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Customer Info */}
      {formData.date && formData.time && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            4. Ihre Kontaktdaten
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-Mail *
              </label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon {business.settings.requirePhone ? '*' : '(Optional)'}
            </label>
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={business.settings.requirePhone}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Besondere Wünsche (Optional)
            </label>
            <textarea
              value={formData.specialRequests}
              onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="z.B. Fensterplatz, Allergien, etc."
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Wird gebucht...' : 'Jetzt buchen'}
          </button>
        </div>
      )}
    </form>
  )
}