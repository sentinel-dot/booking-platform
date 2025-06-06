import { notFound } from 'next/navigation'
import BookingForm from '@/components/BookingForm'

interface Business {
  id: number
  name: string
  type: string
  description: string
  phone: string
  address: string
  city: string
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

async function getBusiness(slug: string): Promise<Business | null> {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/businesses/${slug}`,
      { 
        cache: 'no-store' // Always fresh data for booking pages
      }
    )
    
    if (!response.ok) {
      return null
    }
    
    return response.json()
  } catch (error) {
    console.error('Error fetching business:', error)
    return null
  }
}

export default async function BookingPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  const business = await getBusiness(slug)

  if (!business) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {business.name}
              </h1>
              <p className="text-gray-600 mt-1">{business.description}</p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <span>{business.address}, {business.city}</span>
                <span className="mx-2">•</span>
                <span>{business.phone}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {business.type === 'restaurant' ? '🍽️ Restaurant' : '💇 Friseursalon'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Jetzt Termin buchen
          </h2>
          
          <BookingForm business={business} />
        </div>
      </div>

      {/* Services Info */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Verfügbare Services
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {business.services.map((service) => (
              <div 
                key={service.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h4 className="font-medium text-gray-900">{service.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {service.durationMinutes} Min.
                  </span>
                  {service.price && parseFloat(service.price) > 0 && (
                    <span className="font-medium text-green-600">
                      €{parseFloat(service.price).toFixed(2)}
                    </span>
                  )}
                </div>
                
                {service.capacity > 1 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Für bis zu {service.capacity} Personen
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Generate page title
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  const business = await getBusiness(slug)
  
  if (!business) {
    return {
      title: 'Business not found'
    }
  }

  return {
    title: `Buche bei ${business.name}`,
    description: business.description,
  }
}