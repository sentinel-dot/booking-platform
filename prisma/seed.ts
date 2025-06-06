import { PrismaClient, BusinessType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Test User erstellen
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      passwordHash: hashedPassword,
      firstName: 'Max',
      lastName: 'Mustermann',
      emailVerified: true,
    },
  })

  // Test Restaurant
  const restaurant = await prisma.business.create({
    data: {
      name: 'Bella Vista Restaurant',
      type: BusinessType.restaurant,
      email: 'bella@vista.com',
      phone: '+49 30 12345678',
      address: 'Hauptstraße 123',
      city: 'Berlin',
      postalCode: '10115',
      description: 'Authentische italienische Küche im Herzen Berlins',
      bookingLinkSlug: 'bella-vista',
      userBusinesses: {
        create: {
          userId: user.id,
          role: 'owner',
        },
      },
    },
  })

  // Restaurant Services (Tische)
  const restaurantServices = await Promise.all([
    prisma.service.create({
      data: {
        businessId: restaurant.id,
        name: 'Tisch für 2 Personen',
        description: 'Gemütlicher Tisch für zwei Personen',
        durationMinutes: 120,
        price: 0,
        capacity: 2,
        requiresStaff: false,
      },
    }),
    prisma.service.create({
      data: {
        businessId: restaurant.id,
        name: 'Tisch für 4 Personen',
        description: 'Perfekt für kleine Gruppen',
        durationMinutes: 120,
        price: 0,
        capacity: 4,
        requiresStaff: false,
      },
    }),
    prisma.service.create({
      data: {
        businessId: restaurant.id,
        name: 'Großer Tisch (6-8 Personen)',
        description: 'Ideal für Familienfeiern',
        durationMinutes: 150,
        price: 0,
        capacity: 8,
        requiresStaff: false,
      },
    }),
  ])

  // Test Friseursalon
  const hairSalon = await prisma.business.create({
    data: {
      name: 'Salon Schmidt',
      type: BusinessType.hair_salon,
      email: 'info@salon-schmidt.com',
      phone: '+49 30 87654321',
      address: 'Friedrichstraße 456',
      city: 'Berlin',
      postalCode: '10117',
      description: 'Moderner Friseursalon mit erfahrenen Stylisten',
      bookingLinkSlug: 'salon-schmidt',
      userBusinesses: {
        create: {
          userId: user.id,
          role: 'owner',
        },
      },
    },
  })

  // Friseur Staff
  const staff = await Promise.all([
    prisma.staffMember.create({
      data: {
        businessId: hairSalon.id,
        name: 'Anna Schmidt',
        email: 'anna@salon-schmidt.com',
        description: 'Spezialistin für Damenhaarschnitte und Colorationen',
      },
    }),
    prisma.staffMember.create({
      data: {
        businessId: hairSalon.id,
        name: 'Klaus Meyer',
        email: 'klaus@salon-schmidt.com',
        description: 'Experte für Herrenschnitte und Bärte',
      },
    }),
  ])

  // Friseur Services
  const hairServices = await Promise.all([
    prisma.service.create({
      data: {
        businessId: hairSalon.id,
        name: 'Herrenhaarschnitt',
        description: 'Klassischer Herrenhaarschnitt mit Styling',
        durationMinutes: 45,
        price: 35.00,
        capacity: 1,
        requiresStaff: true,
        bufferAfterMinutes: 15,
      },
    }),
    prisma.service.create({
      data: {
        businessId: hairSalon.id,
        name: 'Damenhaarschnitt',
        description: 'Schnitt und Styling für Damen',
        durationMinutes: 90,
        price: 55.00,
        capacity: 1,
        requiresStaff: true,
        bufferAfterMinutes: 15,
      },
    }),
    prisma.service.create({
      data: {
        businessId: hairSalon.id,
        name: 'Coloration',
        description: 'Professionelle Haarfärbung',
        durationMinutes: 180,
        price: 95.00,
        capacity: 1,
        requiresStaff: true,
        bufferAfterMinutes: 30,
      },
    }),
  ])

  // Staff-Service Zuordnungen
  await Promise.all([
    // Anna kann alle Services
    ...hairServices.map(service =>
      prisma.staffService.create({
        data: {
          staffMemberId: staff[0].id,
          serviceId: service.id,
        },
      })
    ),
    // Klaus nur Herrenhaarschnitt
    prisma.staffService.create({
      data: {
        staffMemberId: staff[1].id,
        serviceId: hairServices[0].id,
      },
    }),
  ])

  // Öffnungszeiten für Restaurant (Mo-So)
  const restaurantHours = []
  for (let day = 1; day <= 7; day++) {
    restaurantHours.push(
      prisma.availabilityRule.create({
        data: {
          businessId: restaurant.id,
          dayOfWeek: day === 7 ? 0 : day, // Sonntag = 0
          startTime: day === 1 ? '17:00' : '11:30', // Montag nur Abend
          endTime: '22:00',
        },
      })
    )
  }
  await Promise.all(restaurantHours)

  // Öffnungszeiten für Friseursalon (Di-Sa)
  const salonHours = []
  for (let day = 2; day <= 6; day++) { // Di-Sa
    // Für beide Staff Members
    for (const staffMember of staff) {
      salonHours.push(
        prisma.availabilityRule.create({
          data: {
            staffMemberId: staffMember.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '18:00',
          },
        })
      )
    }
  }
  await Promise.all(salonHours)

  // Test Buchungen
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  await Promise.all([
    prisma.booking.create({
      data: {
        businessId: restaurant.id,
        serviceId: restaurantServices[1].id, // Tisch für 4
        customerName: 'Familie Müller',
        customerEmail: 'mueller@example.com',
        customerPhone: '+49 170 1234567',
        bookingDate: tomorrow,
        startTime: '19:00',
        endTime: '21:00',
        partySize: 4,
        status: 'confirmed',
        specialRequests: 'Vegetarische Optionen gewünscht',
      },
    }),
    prisma.booking.create({
      data: {
        businessId: hairSalon.id,
        serviceId: hairServices[0].id, // Herrenhaarschnitt
        staffMemberId: staff[1].id, // Klaus
        customerName: 'Peter Schmidt',
        customerEmail: 'peter@example.com',
        bookingDate: tomorrow,
        startTime: '10:00',
        endTime: '10:45',
        partySize: 1,
        status: 'pending',
        totalAmount: 35.00,
      },
    }),
  ])

  console.log('✅ Seed data created successfully!')
  console.log('📧 Test User: test@example.com / password123')
  console.log('🍕 Restaurant: http://localhost:3000/book/bella-vista')
  console.log('💇 Salon: http://localhost:3000/book/salon-schmidt')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })