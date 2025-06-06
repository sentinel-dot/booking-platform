import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addMinutes, format, parse, startOfDay, isBefore } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const businessId = searchParams.get('business_id')
    const date = searchParams.get('date')
    const serviceId = searchParams.get('service_id')
    const staffId = searchParams.get('staff_id')
    
    if (!businessId || !date || !serviceId) {
      return NextResponse.json(
        { error: 'business_id, date und service_id sind erforderlich' },
        { status: 400 }
      )
    }

    const businessIdNum = parseInt(businessId)
    const serviceIdNum = parseInt(serviceId)
    const staffIdNum = staffId ? parseInt(staffId) : undefined

    // Business und Service laden
    const business = await prisma.business.findUnique({
      where: { id: businessIdNum },
      include: {
        services: {
          where: { id: serviceIdNum },
        },
      },
    })

    if (!business || business.services.length === 0) {
      return NextResponse.json(
        { error: 'Business oder Service nicht gefunden' },
        { status: 404 }
      )
    }

    const service = business.services[0]
    const bookingDate = new Date(date)
    const dayOfWeek = bookingDate.getDay()

    // Prüfe ob Datum in der Vergangenheit liegt
    if (isBefore(bookingDate, startOfDay(new Date()))) {
      return NextResponse.json({
        date,
        available_slots: [],
        message: 'Datum liegt in der Vergangenheit',
      })
    }

    // Hole Öffnungszeiten
    const availabilityRules = await prisma.availabilityRule.findMany({
      where: {
        OR: [
          { businessId: businessIdNum, staffMemberId: null },
          { staffMemberId: staffIdNum },
        ],
        dayOfWeek: dayOfWeek,
        isActive: true,
      },
    })

    if (availabilityRules.length === 0) {
      return NextResponse.json({
        date,
        available_slots: [],
        message: 'Geschlossen an diesem Tag',
      })
    }

    // Prüfe spezielle Verfügbarkeiten
    const specialAvailability = await prisma.specialAvailability.findFirst({
      where: {
        OR: [
          { businessId: businessIdNum, staffMemberId: null },
          { staffMemberId: staffIdNum },
        ],
        date: bookingDate,
      },
    })

    if (specialAvailability && !specialAvailability.isAvailable) {
      return NextResponse.json({
        date,
        available_slots: [],
        message: specialAvailability.reason || 'Nicht verfügbar',
      })
    }

    // Existierende Buchungen für den Tag laden
    const existingBookings = await prisma.booking.findMany({
      where: {
        businessId: businessIdNum,
        bookingDate: bookingDate,
        status: { in: ['pending', 'confirmed'] },
      },
      include: {
        staffMember: true,
      },
    })

    // Verfügbare Zeitslots generieren
    const availableSlots = []

    for (const rule of availabilityRules) {
      const slots = generateTimeSlots({
        startTime: rule.startTime,
        endTime: rule.endTime,
        serviceDuration: service.durationMinutes,
        bufferBefore: service.bufferBeforeMinutes,
        bufferAfter: service.bufferAfterMinutes,
        existingBookings,
        serviceId: serviceIdNum,
        staffId: staffIdNum,
        serviceCapacity: service.capacity,
      })

      availableSlots.push(...slots)
    }

    // Duplikate entfernen und sortieren
    const uniqueSlots = Array.from(
      new Map(availableSlots.map(slot => [slot.start_time, slot])).values()
    ).sort((a, b) => a.start_time.localeCompare(b.start_time))

    return NextResponse.json({
      date,
      service_name: service.name,
      duration_minutes: service.durationMinutes,
      available_slots: uniqueSlots,
    })

  } catch (error) {
    console.error('Availability check error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

function generateTimeSlots({
  startTime,
  endTime,
  serviceDuration,
  bufferBefore = 0,
  bufferAfter = 0,
  existingBookings,
  serviceId,
  staffId,
  serviceCapacity,
}: {
  startTime: string
  endTime: string
  serviceDuration: number
  bufferBefore: number
  bufferAfter: number
  existingBookings: any[]
  serviceId: number
  staffId?: number
  serviceCapacity: number
}): Array<{ start_time: string; end_time: string; staff_member_id?: number; staff_name?: string }> {
  
  const slots = []
  const totalDuration = bufferBefore + serviceDuration + bufferAfter
  
  // Start- und Endzeit parsen
  const start = parse(startTime, 'HH:mm', new Date())
  const end = parse(endTime, 'HH:mm', new Date())
  
  let currentTime = start

  while (currentTime.getTime() + totalDuration * 60000 <= end.getTime()) {
    const slotStart = format(addMinutes(currentTime, bufferBefore), 'HH:mm')
    const slotEnd = format(addMinutes(currentTime, bufferBefore + serviceDuration), 'HH:mm')
    
    // Prüfe Konflikte mit existierenden Buchungen
    const hasConflict = existingBookings.some(booking => {
      // Für Staff-basierte Services
      if (staffId && booking.staffMemberId === staffId) {
        return timeOverlaps(slotStart, slotEnd, booking.startTime, booking.endTime)
      }
      
      // Für Service-basierte Services (Restaurants)
      if (!staffId && booking.serviceId === serviceId) {
        if (serviceCapacity > 1) {
          // Restaurant: Prüfe Kapazität
          const overlappingBookings = existingBookings.filter(b => 
            b.serviceId === serviceId && 
            timeOverlaps(slotStart, slotEnd, b.startTime, b.endTime)
          )
          const totalBooked = overlappingBookings.reduce((sum, b) => sum + b.partySize, 0)
          return totalBooked >= serviceCapacity
        } else {
          // Kapazität 1: Prüfe einfache Überlappung
          return timeOverlaps(slotStart, slotEnd, booking.startTime, booking.endTime)
        }
      }
      
      return false
    })

    if (!hasConflict) {
      slots.push({
        start_time: slotStart,
        end_time: slotEnd,
        ...(staffId && { 
          staff_member_id: staffId,
          staff_name: 'Staff Member' // TODO: Get actual staff name
        }),
      })
    }

    // Nächster Slot (alle 15 oder 30 Minuten)
    currentTime = addMinutes(currentTime, 15) // TODO: Make configurable
  }

  return slots
}

function timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
  return start1 < end2 && end1 > start2
}