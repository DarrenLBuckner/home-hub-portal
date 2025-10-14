'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/supabase';
import GlobalSouthLocationSelector from "@/components/GlobalSouthLocationSelector";
import EnhancedImageUpload from "@/components/EnhancedImageUpload";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";

const PROPERTY_TYPES = ["House", "Apartment", "Condo", "Townhouse", "Studio", "Room"];
const FEATURES = ["Pool", "Garage", "Garden", "Security", "Furnished", "AC", "Internet", "Pet Friendly", "Laundry", "Gym", "Gated", "Fruit Trees", "Farmland", "Backup Generator", "Solar", "Electric Gate"];

type PropertyForm = {
  title: string;
  description: string;
  price: string;
  location: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  squareFootage: string;
  features: string[];
  status: string;
  images: File[];
  attestation: boolean;
  listingType: string;
};

export default function EditFSBOProperty() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [selectedCountry, setSelectedCountry] = useState<string>("GY");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [currencyCode, setCurrencyCode] = useState<string>("GYD");
  const [currencySymbol, setCurrencySymbol] = useState<string>("GY$");
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [formData, setFormData] = useState<PropertyForm>({
    title: '',
    description: '',
    price: '',
    location: 'GY',
    propertyType: 'House',
    bedrooms: '',
    bathrooms: '',
    squareFootage: '',
    features: [],
    status: 'off_market',
    images: [],
    attestation: true,
    listingType: 'sale',
  });

  const supabase = createClient();

  // Load existing property data
  useEffect(() => {
    async function loadPropertyData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch property data with images
        const { data: property, error: propertyError } = await supabase
          .from('properties')
          .select(`
            *,
            property_media!property_media_property_id_fkey (
              media_url,
              media_type,
              display_order,
              is_primary
            )
          `)
          .eq('id', propertyId)
          .eq('user_id', user.id)
          .single();

        if (propertyError) {
          console.error('Error loading property:', propertyError);
          setError('Property not found or access denied');
          return;
        }

        if (property) {
          // Populate form data from existing property
          setFormData({
            title: property.title || '',
            description: property.description || '',
            price: property.price?.toString() || '',
            location: property.location || 'GY',
            propertyType: property.property_type || 'House',
            bedrooms: property.bedrooms?.toString() || '',
            bathrooms: property.bathrooms?.toString() || '',
            squareFootage: property.house_size_value?.toString() || '',
            features: Array.isArray(property.amenities) ? property.amenities : [],
            status: property.status || 'off_market',
            images: [],
            attestation: true,
            listingType: property.listing_type || 'sale',
          });

          // Set location and currency info
          setSelectedCountry(property.location || 'GY');
          setSelectedRegion(property.region || '');
          setCurrencyCode(property.currency || 'GYD');
          setCurrencySymbol(getCurrencySymbol(property.currency || 'GYD'));

          // Set existing images
          const propertyImages = property.property_media
            ?.filter(media => media.media_type === 'image')
            ?.sort((a, b) => {
              if (a.is_primary && !b.is_primary) return -1;
              if (!a.is_primary && b.is_primary) return 1;
              return a.display_order - b.display_order;
            })
            ?.map(media => media.media_url) || [];
          
          setExistingImages(propertyImages);
        }

      } catch (error) {
        console.error('Error loading property data:', error);
        setError('Failed to load property data');
      } finally {
        setLoading(false);
      }
    }

    if (propertyId) {
      loadPropertyData();
    }
  }, [propertyId, router, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLocationChange = (field: 'country' | 'region', value: string) => {
    if (field === 'country') {
      setSelectedCountry(value);
      setSelectedRegion('');
      setFormData(prev => ({ ...prev, location: value }));
    } else {
      setSelectedRegion(value);
    }
  };

  const handleCurrencyChange = (code: string, symbol: string) => {
    setCurrencyCode(code);
    setCurrencySymbol(symbol);
  };

  const handleFeatureChange = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleImagesChange = (images: File[]) => {
    setFormData(prev => ({ ...prev, images }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submittingRef.current || isSubmitting) {
      console.log('⚠️ Double-submit blocked');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      // Prepare property data for update
      const propertyData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        location: formData.location,
        property_type: formData.propertyType,
        bedrooms: parseInt(formData.bedrooms) || null,
        bathrooms: parseFloat(formData.bathrooms) || null,
        house_size_value: parseFloat(formData.squareFootage) || null,
        house_size_unit: 'sq ft',
        amenities: formData.features,
        listing_type: 'sale', // FSBO properties are always for sale
        currency: currencyCode,
        updated_at: new Date().toISOString(),
      };

      // Update property via API
      const response = await fetch(`/api/properties/update/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...propertyData,
          images: formData.images // New images to upload
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update property');
      }

      setSuccess('Property updated successfully!');
      
      // Redirect back to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard/fsbo');
      }, 2000);

    } catch (error) {
      console.error('Update error:', error);
      setError(error.message || 'Failed to update property. Please try again.');
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading property data...</p>
        </div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/dashboard/fsbo')}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-orange-700">Edit For Sale By Owner Property</h1>
            <button
              onClick={() => router.push('/dashboard/fsbo')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold mb-4 text-orange-700">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Title *</label>
                <input 
                  name="title" 
                  type="text" 
                  placeholder="Beautiful 3BR House for Sale" 
                  value={formData.title} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-orange-500 rounded-lg text-gray-900"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type *</label>
                <select 
                  name="propertyType" 
                  value={formData.propertyType} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-orange-500 rounded-lg text-gray-900"
                  required
                >
                  {PROPERTY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price ({currencySymbol}) *</label>
                <input 
                  name="price" 
                  type="number" 
                  placeholder="250000" 
                  value={formData.price} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-orange-500 rounded-lg text-gray-900" 
                  required 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea 
                  name="description" 
                  placeholder="Describe your property..." 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-orange-500 rounded-lg text-gray-900 resize-none" 
                  required
                />
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold mb-4 text-orange-700">Property Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                <input 
                  name="bedrooms" 
                  type="number" 
                  placeholder="3" 
                  value={formData.bedrooms} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-orange-500 rounded-lg text-gray-900" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                <input 
                  name="bathrooms" 
                  type="number" 
                  placeholder="2" 
                  value={formData.bathrooms} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-orange-500 rounded-lg text-gray-900" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Square Footage</label>
                <input 
                  name="squareFootage" 
                  type="number" 
                  placeholder="2000" 
                  value={formData.squareFootage} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-orange-500 rounded-lg text-gray-900" 
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold mb-4 text-orange-700">Location</h3>
            <GlobalSouthLocationSelector
              selectedCountry={selectedCountry}
              selectedRegion={selectedRegion}
              onLocationChange={handleLocationChange}
              onCurrencyChange={handleCurrencyChange}
            />
          </div>

          {/* Features */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold mb-4 text-orange-700">Features & Amenities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {FEATURES.map(feature => (
                <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => handleFeatureChange(feature)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold mb-4 text-orange-700">Property Photos</h3>
            <EnhancedImageUpload
              onImagesChange={handleImagesChange}
              existingImages={existingImages}
              maxImages={15}
            />
          </div>

          {/* Submit */}
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-8 py-4 bg-orange-600 text-white rounded-lg font-semibold text-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Updating Property...
                </span>
              ) : (
                'Update Property'
              )}
            </button>
            <p className="text-center text-sm text-gray-700 mt-3">
              Your property updates will be saved
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}