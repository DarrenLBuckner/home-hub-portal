import PropertiesListClient from '@/components/PropertiesListClient';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  region: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  house_size_value: number;
  land_size_value: number;
  images: string[];
  amenities: string[];
  listing_type: string;
  status: string;
  created_at: string;
}

export const metadata = {
  title: 'Properties for Rent - Guyana Home Hub', 
  description: 'Browse rental properties in Guyana. Find apartments, houses, and rooms for rent.',
  keywords: 'properties for rent, Guyana rentals, apartments for rent, houses for rent'
};

// Server-side data fetching
async function getProperties(): Promise<Property[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/public/properties?site=guyana&listing_type=rent&limit=50`, {
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch properties');
    }
    
    const data = await response.json();
    return data.properties || [];
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
}

export default async function RentPropertiesPage() {
  const properties = await getProperties();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Properties for Rent</h1>
          <p className="text-xl text-blue-100">
            Find your perfect rental home in Guyana
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PropertiesListClient 
          initialProperties={properties}
          listingType="rent"
        />
      </div>
    </div>
  );
}