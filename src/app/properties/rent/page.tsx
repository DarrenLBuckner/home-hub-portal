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

// Skip server-side data fetching during build to avoid connection errors
// Data will be fetched client-side by PropertiesListClient component
export default function RentPropertiesPage() {
  // No server-side data fetching - handled by client component

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
          initialProperties={[]}
          listingType="rent"
        />
      </div>
    </div>
  );
}