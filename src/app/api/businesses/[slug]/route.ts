import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const business = await prisma.business.findUnique({
      where: {
        bookingLinkSlug: slug,
        isActive: true,
      },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        staffMembers: {
          where: { isActive: true },
          include: {
            staffServices: {
              include: {
                service: true,
              },
            },
          },
        },
        availabilityRules: {
          where: { isActive: true },
        },
      },
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Transform data for frontend
    const transformedBusiness = {
      id: business.id,
      name: business.name,
      type: business.type,
      description: business.description,
      phone: business.phone,
      address: business.address,
      city: business.city,
      services: business.services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        price: service.price,
        capacity: service.capacity,
        requiresStaff: service.requiresStaff,
      })),
      staffMembers: business.staffMembers.map(staff => ({
        id: staff.id,
        name: staff.name,
        description: staff.description,
        services: staff.staffServices.map(ss => ss.service),
      })),
      settings: {
        bookingAdvanceDays: business.bookingAdvanceDays,
        cancellationHours: business.cancellationHours,
        requirePhone: business.requirePhone,
        requireDeposit: business.requireDeposit,
      },
    }

    return NextResponse.json(transformedBusiness)
  } catch (error) {
    console.error('Error fetching business:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}