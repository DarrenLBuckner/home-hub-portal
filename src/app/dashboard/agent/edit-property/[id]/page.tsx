'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/supabase';
import CompletionIncentive, { CompletionProgress } from "@/components/CompletionIncentive";
import { calculateCompletionScore, getUserMotivation } from "@/lib/completionUtils";

// Reusing existing agent create-property components  
import GlobalSouthLocationSelector from "@/components/GlobalSouthLocationSelector";
import EnhancedImageUpload from "@/components/EnhancedImageUpload";
import AmenitiesSelector from "@/components/AmenitiesSelector";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import AIDescriptionAssistant from "@/components/AIDescriptionAssistant";
import LotDimensions from "@/components/LotDimensions";
import { DimensionUnit } from "@/lib/lotCalculations";

interface FormData {
  location: string;
  title: string;
  description: string;
  price: string;
  status: string;
  property_type: string;
  listing_type: string;
  bedrooms: string;
  bathrooms: string;
  house_size_value: string;
  house_size_unit: string;
  land_size_value: string;
  land_size_unit: string;
  year_built: string;
  amenities: string[];
  region: string;
  city: string;
  neighborhood: string;
  lot_length: string;
  lot_width: string;
  lot_dimension_unit: string;
  owner_whatsapp: string;
}

export default function EditAgentProperty() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [form, setForm] = useState<FormData>({
    location: "",
    title: "",
    description: "",
    price: "",
    status: "draft",
    property_type: "House",
    listing_type: "sale",
    bedrooms: "",
    bathrooms: "",
    house_size_value: "",
    house_size_unit: "sq ft",
    land_size_value: "",
    land_size_unit: "sq ft",
    year_built: "",
    amenities: [],
    region: "",
    city: "",
    neighborhood: "",
    lot_length: "",
    lot_width: "",
    lot_dimension_unit: "ft",
    owner_whatsapp: "",
  });

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("GY");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [currencyCode, setCurrencyCode] = useState<string>("GYD");
  const [currencySymbol, setCurrencySymbol] = useState<string>("GY$");
  
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
          setForm({
            location: property.location || '',
            title: property.title || '',
            description: property.description || '',
            price: property.price?.toString() || '',
            status: property.status || 'draft',
            property_type: property.property_type || 'House',
            listing_type: property.listing_type || 'sale',
            bedrooms: property.bedrooms?.toString() || '',
            bathrooms: property.bathrooms?.toString() || '',
            house_size_value: property.house_size_value?.toString() || '',
            house_size_unit: property.house_size_unit || 'sq ft',
            land_size_value: property.land_size_value?.toString() || '',
            land_size_unit: property.land_size_unit || 'sq ft',
            year_built: property.year_built?.toString() || '',
            amenities: Array.isArray(property.amenities) ? property.amenities : [],
            region: property.region || '',
            city: property.city || '',
            neighborhood: property.neighborhood || '',
            lot_length: property.lot_length?.toString() || '',
            lot_width: property.lot_width?.toString() || '',
            lot_dimension_unit: property.lot_dimension_unit || 'ft',
            owner_whatsapp: property.owner_whatsapp || '',
          });

          // Set location and currency info
          setSelectedCountry(property.location || 'GY');
          setSelectedRegion(property.region || '');
          setCurrencyCode(property.currency || 'GYD');
          setCurrencySymbol(getCurrencySymbol(property.currency || 'GYD'));

          // Set existing images
          const propertyImages = property.property_media
            ?.filter((media: any) => media.media_type === 'image')
            ?.sort((a: any, b: any) => {
              if (a.is_primary && !b.is_primary) return -1;
              if (!a.is_primary && b.is_primary) return 1;
              return a.display_order - b.display_order;
            })
            ?.map((media: any) => media.media_url) || [];
          
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

  // Calculate completion score in real-time
  const completionAnalysis = calculateCompletionScore({
    ...form,
    images: images as File[],
    amenities: Array.isArray(form.amenities) ? form.amenities : []
  });

  const userMotivation = getUserMotivation('agent');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleLocationChange = (field: 'country' | 'region', value: string) => {
    if (field === 'country') {
      setSelectedCountry(value);
      setSelectedRegion('');
      setForm({ ...form, location: value, region: '' });
    } else {
      setSelectedRegion(value);
      setForm({ ...form, region: value });
    }
  };

  const handleCurrencyChange = (code: string, symbol: string) => {
    setCurrencyCode(code);
    setCurrencySymbol(symbol);
  };

  const handleImagesChange = (images: File[]) => {
    setImages(images);
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
        location: form.location,
        title: form.title,
        description: form.description,
        price: parseFloat(form.price) || 0,
        property_type: form.property_type,
        listing_type: form.listing_type,
        bedrooms: parseInt(form.bedrooms) || null,
        bathrooms: parseFloat(form.bathrooms) || null,
        house_size_value: parseFloat(form.house_size_value) || null,
        house_size_unit: form.house_size_unit,
        land_size_value: parseFloat(form.land_size_value) || null,
        land_size_unit: form.land_size_unit,
        year_built: parseInt(form.year_built) || null,
        amenities: form.amenities,
        lot_length: parseFloat(form.lot_length) || null,
        lot_width: parseFloat(form.lot_width) || null,
        lot_dimension_unit: form.lot_dimension_unit,
        region: form.region,
        city: form.city,
        neighborhood: form.neighborhood,
        owner_whatsapp: form.owner_whatsapp,
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
          images: images // New images to upload
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update property');
      }

      setSuccess('Property updated successfully!');
      
      // Redirect back to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard/agent');
      }, 2000);

    } catch (error) {
      console.error('Update error:', error);
      setError((error as Error).message || 'Failed to update property. Please try again.');
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading property data...</p>
        </div>
      </div>
    );
  }

  if (error && !form.title) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/dashboard/agent')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-blue-600">Edit Property</h1>
            <button
              onClick={() => router.push('/dashboard/agent')}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Completion Incentive */}
        <div className="mb-6">
          <CompletionProgress 
            completionAnalysis={completionAnalysis}
            userMotivation={userMotivation}
          />
        </div>

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
          
          {/* 1. PROPERTY BASICS */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🏠 Property Basics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Title</label>
                <input 
                  name="title" 
                  type="text" 
                  placeholder="Beautiful 3BR House in Georgetown" 
                  value={form.title} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                <select 
                  name="property_type" 
                  value={form.property_type} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                >
                  <option value="House">House</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Condo">Condo</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Land">Land/Lot</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Listing Type</label>
                <select 
                  name="listing_type" 
                  value={form.listing_type} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                >
                  <option value="sale">🏠 For Sale</option>
                  <option value="rent">🏡 For Rent</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Price ({currencySymbol})</label>
                <input 
                  name="price" 
                  type="number" 
                  placeholder="250000" 
                  value={form.price} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                  required 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <div className="relative">
                  <textarea 
                    name="description" 
                    placeholder="Describe your property..." 
                    value={form.description} 
                    onChange={handleChange} 
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900 resize-none" 
                  />
                  <AIDescriptionAssistant 
                    onDescriptionGenerated={(description) => setForm({...form, description})}
                    currentDescription={form.description}
                    propertyData={{
                      title: form.title,
                      propertyType: form.property_type,
                      bedrooms: form.bedrooms,
                      bathrooms: form.bathrooms,
                      price: form.price,
                      location: `${form.city || ''}, ${form.region || ''}`.replace(/^, |, $/, ''),
                      squareFootage: form.house_size_value ? `${form.house_size_value} ${form.house_size_unit}` : '',
                      features: [
                        ...(form.amenities || []),
                        form.year_built ? `Built in ${form.year_built}` : '',
                        form.land_size_value ? `${form.land_size_value} ${form.land_size_unit} lot` : '',
                        form.lot_length && form.lot_width ? `Lot dimensions: ${form.lot_length}' x ${form.lot_width}'` : ''
                      ].filter(Boolean)
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. PROPERTY SPECIFICATIONS */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🏘️ Property Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                <input 
                  name="bedrooms" 
                  type="number" 
                  placeholder="0" 
                  value={form.bedrooms} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                <input 
                  name="bathrooms" 
                  type="number" 
                  placeholder="0" 
                  value={form.bathrooms} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">House Size (Optional)</label>
                <div className="flex gap-2">
                  <input 
                    name="house_size_value" 
                    type="number" 
                    placeholder="2000" 
                    value={form.house_size_value} 
                    onChange={handleChange} 
                    className="flex-1 px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                  />
                  <select 
                    name="house_size_unit" 
                    value={form.house_size_unit} 
                    onChange={handleChange} 
                    className="px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                  >
                    <option value="sq ft">Sq Ft</option>
                    <option value="sq m">Sq M</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 3. LAND INFORMATION */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📐 Land & Property Information
            </h3>
            
            <div className="mb-6">
              <LotDimensions
                length={form.lot_length}
                width={form.lot_width}
                unit={form.lot_dimension_unit as DimensionUnit}
                onLengthChange={(length) => setForm(prev => ({ ...prev, lot_length: length }))}
                onWidthChange={(width) => setForm(prev => ({ ...prev, lot_width: width }))}
                onUnitChange={(unit) => setForm(prev => ({ ...prev, lot_dimension_unit: unit }))}
                onAreaCalculated={(areaSqFt) => {
                  setForm(prev => ({ 
                    ...prev, 
                    land_size_value: areaSqFt.toString(),
                    land_size_unit: 'sq ft' 
                  }));
                }}
                label="Lot Dimensions (if rectangular)"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Total Land Area
                {form.lot_length && form.lot_width && (
                  <span className="text-green-600 text-xs ml-2">⚡ Auto-calculated from dimensions above</span>
                )}
              </label>
              <div className="flex gap-2">
                <input 
                  name="land_size_value" 
                  type="number" 
                  placeholder="Total area" 
                  value={form.land_size_value} 
                  onChange={handleChange} 
                  className="flex-1 px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                />
                <select 
                  name="land_size_unit" 
                  value={form.land_size_unit} 
                  onChange={handleChange} 
                  className="px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                >
                  <option value="sq ft">sq ft</option>
                  <option value="sq m">sq m</option>
                  <option value="acres">acres</option>
                  <option value="hectares">hectares</option>
                </select>
              </div>
              <p className="text-xs text-gray-700 mt-1">
                Editable for irregular lots or manual override
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Year Built
                <span className="text-gray-700 text-xs ml-2">Optional - Builds buyer confidence</span>
              </label>
              <input 
                name="year_built" 
                type="number" 
                placeholder="e.g., 2020" 
                value={form.year_built} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                min="1800"
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          {/* 4. LOCATION */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📍 Location & Area Details
            </h3>
            
            <div className="mb-6">
              <GlobalSouthLocationSelector
                selectedCountry={selectedCountry}
                selectedRegion={selectedRegion}
                onLocationChange={handleLocationChange}
                onCurrencyChange={handleCurrencyChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City/Town</label>
                <input 
                  name="city" 
                  type="text" 
                  placeholder="Georgetown" 
                  value={form.city} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Neighborhood/Area</label>
                <input 
                  name="neighborhood" 
                  type="text" 
                  placeholder="Bel Air Park" 
                  value={form.neighborhood} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                />
              </div>
            </div>
          </div>

          {/* 5. AMENITIES */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-indigo-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              ✨ Features & Amenities
            </h3>
            <AmenitiesSelector
              value={form.amenities}
              onChange={(amenities) => setForm({ ...form, amenities })}
            />
          </div>

          {/* 6. CONTACT INFORMATION */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-emerald-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📞 Contact Information
            </h3>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-blue-900 mb-2">How clients will contact you</h4>
              <p className="text-sm text-blue-800">
                Interested buyers and sellers will be able to contact you through WhatsApp. Your contact details will only be shown to serious inquiries.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="owner_whatsapp"
                value={form.owner_whatsapp}
                onChange={handleChange}
                placeholder="+592-XXX-XXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                <strong>Required:</strong> Include country code (+592 for Guyana). Most clients prefer WhatsApp for instant contact.
              </p>
              <div className="bg-green-50 p-3 rounded mt-2">
                <p className="text-sm text-green-800">
                  <strong>💬 Why WhatsApp?</strong> 90% of real estate inquiries in Guyana happen via WhatsApp. This ensures you get contacted quickly by serious clients.
                </p>
              </div>
            </div>
          </div>

          {/* 7. PHOTOS */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-pink-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📸 Property Photos
            </h3>
            <EnhancedImageUpload
              images={images}
              setImages={setImages}
              maxImages={25}
            />
          </div>

          {/* SUBMIT BUTTON */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-gray-500 text-center">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Updating Property...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  🚀 Update Property
                </span>
              )}
            </button>
            <p className="text-center text-sm text-gray-700 mt-3">
              Your property changes will be saved and may require admin review
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}