import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Get country from headers or default to GY
    const cookieStore = await cookies()
    const countryCode = cookieStore.get('country-code')?.value || 'GY'
    
    console.log(`🌍 Portal Services API: Using country: ${countryCode}`)
    
    // For now, return the same services data structure
    // Later this can be connected to the actual services database
    const servicesData = {
      countryCode,
      countryName: countryCode === 'JM' ? 'Jamaica' : 'Guyana',
      services: [
        {
          id: 'drone-photography',
          name: 'Drone Photography',
          slug: 'drone-photography', 
          description: 'Professional aerial photography showcasing your property from stunning angles',
          shortDescription: 'Stunning aerial shots that make your property stand out',
          icon: 'drone',
          category: 'photography',
          price: countryCode === 'JM' ? 15000 : 25000,
          currency: countryCode === 'JM' ? 'JMD' : 'GYD',
          contactEmail: 'services@portalhomehub.com',
          contactPhone: '+592-123-4567',
          featuredImage: '/images/services/drone-photography.jpg',
          galleryImages: []
        },
        {
          id: 'property-photography',
          name: 'Property Photography',
          slug: 'property-photography',
          description: 'Professional interior and exterior photography highlighting your property\'s best features',
          shortDescription: 'Professional photos that showcase your property\'s best features',
          icon: 'camera',
          category: 'photography',
          price: countryCode === 'JM' ? 12000 : 20000,
          currency: countryCode === 'JM' ? 'JMD' : 'GYD',
          contactEmail: 'services@portalhomehub.com',
          contactPhone: '+592-123-4567',
          featuredImage: '/images/services/property-photography.jpg',
          galleryImages: []
        },
        {
          id: '3d-virtual-tour',
          name: '3D Virtual Tour',
          slug: '3d-virtual-tour',
          description: 'Interactive 3D virtual tours allowing potential buyers to explore your property remotely',
          shortDescription: 'Interactive virtual tours for remote property viewing',
          icon: 'cube',
          category: 'virtual-tours',
          price: countryCode === 'JM' ? 20000 : 35000,
          currency: countryCode === 'JM' ? 'JMD' : 'GYD',
          contactEmail: 'services@portalhomehub.com',
          contactPhone: '+592-123-4567',
          featuredImage: '/images/services/3d-virtual-tour.jpg',
          galleryImages: []
        },
        {
          id: 'lockbox-placement',
          name: 'Lockbox Installation',
          slug: 'lockbox-placement',
          description: 'Secure lockbox installation for safe and convenient property access',
          shortDescription: 'Secure lockbox installation for convenient showings',
          icon: 'lock',
          category: 'logistics',
          price: countryCode === 'JM' ? 8000 : 15000,
          currency: countryCode === 'JM' ? 'JMD' : 'GYD',
          contactEmail: 'services@portalhomehub.com',
          contactPhone: '+592-123-4567',
          featuredImage: '/images/services/lockbox.jpg',
          galleryImages: []
        }
      ],
      servicesByCategory: {},
      packages: [
        {
          id: 'complete-marketing-package',
          name: 'Complete Marketing Package',
          slug: 'complete-marketing-package',
          description: 'Everything you need to market your property professionally',
          shortDescription: 'Complete professional marketing solution',
          price: countryCode === 'JM' ? 45000 : 75000,
          currency: countryCode === 'JM' ? 'JMD' : 'GYD',
          savings: countryCode === 'JM' ? 10000 : 20000,
          isFeatured: true,
          packageType: 'complete',
          durationDays: 3,
          includes: [
            'Professional Property Photography',
            'Drone Aerial Photography', 
            '3D Virtual Tour',
            'Lockbox Installation',
            'Social Media Ready Images',
            'Professional Listing Description'
          ],
          includedServices: [
            { id: 'property-photography', name: 'Property Photography', slug: 'property-photography', icon: 'camera', quantity: 1 },
            { id: 'drone-photography', name: 'Drone Photography', slug: 'drone-photography', icon: 'drone', quantity: 1 },
            { id: '3d-virtual-tour', name: '3D Virtual Tour', slug: '3d-virtual-tour', icon: 'cube', quantity: 1 },
            { id: 'lockbox-placement', name: 'Lockbox Installation', slug: 'lockbox-placement', icon: 'lock', quantity: 1 }
          ]
        }
      ],
      featuredPackage: {
        id: 'complete-marketing-package',
        name: 'Complete Marketing Package',
        slug: 'complete-marketing-package',
        description: 'Everything you need to market your property professionally',
        shortDescription: 'Complete professional marketing solution',
        price: countryCode === 'JM' ? 45000 : 75000,
        currency: countryCode === 'JM' ? 'JMD' : 'GYD',
        savings: countryCode === 'JM' ? 10000 : 20000,
        isFeatured: true,
        packageType: 'complete',
        durationDays: 3,
        includes: [
          'Professional Property Photography',
          'Drone Aerial Photography', 
          '3D Virtual Tour',
          'Lockbox Installation',
          'Social Media Ready Images',
          'Professional Listing Description'
        ],
        includedServices: [
          { id: 'property-photography', name: 'Property Photography', slug: 'property-photography', icon: 'camera', quantity: 1 },
          { id: 'drone-photography', name: 'Drone Photography', slug: 'drone-photography', icon: 'drone', quantity: 1 },
          { id: '3d-virtual-tour', name: '3D Virtual Tour', slug: '3d-virtual-tour', icon: 'cube', quantity: 1 },
          { id: 'lockbox-placement', name: 'Lockbox Installation', slug: 'lockbox-placement', icon: 'lock', quantity: 1 }
        ]
      }
    }

    // Organize services by category
    servicesData.servicesByCategory = servicesData.services.reduce((acc: any, service) => {
      if (!acc[service.category]) {
        acc[service.category] = []
      }
      acc[service.category].push(service)
      return acc
    }, {})

    return NextResponse.json(servicesData)
  } catch (error) {
    console.error('Portal Services API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch services',
        countryCode: 'GY',
        countryName: 'Guyana', 
        services: [], 
        servicesByCategory: {},
        packages: [],
        featuredPackage: null
      },
      { status: 500 }
    )
  }
}