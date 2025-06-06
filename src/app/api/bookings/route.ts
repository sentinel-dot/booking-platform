import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addMinutes, format, parse } from 'date-fns'

interface BookingRequest {
  business_id: number
  service_id: number
  staff_member_id?: number
  customer_name: string
  customer_email: string
  customer_phone?: string
  booking_date: string
  start_time: string
  party_size: number
  special_requests?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingRequest = await request.json()

    // Validierung
    if (!body.business_id || !body.service_id || !body.customer_name || 
        !body.customer_email || !body.booking_date || !body.start_time) {
      return NextResponse.json(
        { error: 'Pflichtfelder fehlen' },
        { status: 400 }
      )
    }

    // Business und Service laden
    const business = await prisma.business.findUnique({
      where: { id: body.business_id },
      include: {
        services: true,
        staffMembers: true,
      },
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Business nicht gefunden' },
        { status: 404 }
      )
    }

    const service = business.services.find(s => s.id === body.service_id)
    if (!service) {
      return NextResponse.json(
        { error: 'Service nicht gefunden' },
        { status: 404 }
      )
    }

    // Staff-Validierung für Friseure
    if (service.requiresStaff && !body.staff_member_id) {
      return NextResponse.json(
        { error: 'Staff Member ist erforderlich für diesen Service' },
        { status: 400 }
      )
    }

    if (body.staff_member_id) {
      const staffMember = business.staffMembers.find(s => s.id === body.staff_member_id)
      if (!staffMember) {
        return NextResponse.json(
          { error: 'Staff Member nicht gefunden' },
          { status: 404 }
        )
      }
    }

    // End-Zeit berechnen
    const startDateTime = parse(body.start_time, 'HH:mm', new Date())
    const endDateTime = addMinutes(startDateTime, service.durationMinutes)
    const endTime = format(endDateTime, 'HH:mm')

    // Verfügbarkeit prüfen
    const isAvailable = await checkAvailability({
      businessId: body.business_id,
      serviceId: body.service_id,
      staffMemberId: body.staff_member_id,
      date: body.booking_date,
      startTime: body.start_time,
      endTime: endTime,
      durationMinutes: service.durationMinutes,
    })

    if (!isAvailable.available) {
      return NextResponse.json(
        { error: isAvailable.reason || 'Zeitslot nicht verfügbar' },
        { status: 409 }
      )
    }

    // Buchung erstellen
    const booking = await prisma.booking.create({
      data: {
        businessId: body.business_id,
        serviceId: body.service_id,
        staffMemberId: body.staff_member_id,
        customerName: body.customer_name,
        customerEmail: body.customer_email,
        customerPhone: body.customer_phone,
        bookingDate: new Date(body.booking_date),
        startTime: body.start_time,
        endTime: endTime,
        partySize: body.party_size,
        specialRequests: body.special_requests,
        totalAmount: service.price,
        status: 'pending',
      },
      include: {
        business: true,
        service: true,
        staffMember: true,
      },
    })

    // TODO: Send confirmation email
    // await sendBookingConfirmation(booking)

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        confirmation_code: `BK${booking.id.toString().padStart(6, '0')}`,
        status: booking.status,
        customer_name: booking.customerName,
        service_name: booking.service.name,
        staff_name: booking.staffMember?.name,
        date: booking.bookingDate,
        start_time: booking.startTime,
        end_time: booking.endTime,
        total_amount: booking.totalAmount,
      },
    })

  } catch (error) {
    console.error('Booking creation error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Verfügbarkeits-Check Funktion
async function checkAvailability({
  businessId,
  serviceId,
  staffMemberId,
  date,
  startTime,
  endTime,
  durationMinutes,
}: {
  businessId: number
  serviceId: number
  staffMemberId?: number
  date: string
  startTime: string
  endTime: string
  durationMinutes: number
}): Promise<{ available: boolean; reason?: string }> {
  
  const bookingDate = new Date(date)
  const dayOfWeek = bookingDate.getDay()

  // 1. Prüfe Öffnungszeiten
  const availabilityRules = await prisma.availabilityRule.findMany({
    where: {
      OR: [
        { businessId: businessId, staffMemberId: null },
        { staffMemberId: staffMemberId },
      ],
      dayOfWeek: dayOfWeek,
      isActive: true,
    },
  })

  if (availabilityRules.length === 0) {
    return { available: false, reason: 'Geschlossen an diesem Tag' }
  }

  // Prüfe ob die gewünschte Zeit in den Öffnungszeiten liegt
  const isWithinBusinessHours = availabilityRules.some(rule => {
    return startTime >= rule.startTime && endTime <= rule.endTime
  })

  if (!isWithinBusinessHours) {
    return { available: false, reason: 'Außerhalb der Öffnungszeiten' }
  }

  // 2. Prüfe spezielle Verfügbarkeiten (Urlaub, Feiertage)
  const specialAvailability = await prisma.specialAvailability.findFirst({
    where: {
      OR: [
        { businessId: businessId, staffMemberId: null },
        { staffMemberId: staffMemberId },
      ],
      date: bookingDate,
    },
  })

  if (specialAvailability && !specialAvailability.isAvailable) {
    return { available: false, reason: specialAvailability.reason || 'Nicht verfügbar' }
  }

  // 3. Prüfe Buchungskollidierungen
  const conflictingBookings = await prisma.booking.findMany({
    where: {
      businessId: businessId,
      bookingDate: bookingDate,
      status: { in: ['pending', 'confirmed'] },
      AND: [
        // Staff/Service Filter
        staffMemberId 
          ? {
              OR: [
                { staffMemberId: staffMemberId },
                { serviceId: serviceId, staffMemberId: null }, // Service ohne Staff
              ]
            }
          : {
              serviceId: serviceId,
            },
        // Zeit-Überlappung Filter
        {
          OR: [
            // Neue Buchung startet während einer existierenden
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } },
              ],
            },
            // Neue Buchung endet während einer existierenden
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } },
              ],
            },
            // Neue Buchung umschließt eine existierende
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } },
              ],
            },
          ],
        },
      ],
    },
  })

  if (conflictingBookings.length > 0) {
    return { available: false, reason: 'Zeitslot bereits gebucht' }
  }

  // 4. Prüfe Service-Kapazität (für Restaurants)
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  })

  if (service && service.capacity > 1) {
    // Für Restaurants: Prüfe ob noch Plätze frei sind
    const existingBookingsInSlot = await prisma.booking.findMany({
      where: {
        serviceId: serviceId,
        bookingDate: bookingDate,
        status: { in: ['pending', 'confirmed'] },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
        ],
      },
    })

    const totalBookedCapacity = existingBookingsInSlot.reduce(
      (sum, booking) => sum + booking.partySize, 
      0
    )

    if (totalBookedCapacity >= service.capacity) {
      return { available: false, reason: 'Keine freien Plätze mehr' }
    }
  }

  return { available: true }
}