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
  land_size_na: boolean;
  year_built: string;
  amenities: string[];
  region: string;
  city: string;
  neighborhood: string;
  address: string;
  show_address: boolean;
  lot_length: string;
  lot_width: string;
  lot_dimension_unit: string;
  owner_whatsapp: string;
  video_url: string;
  // Commercial Property Fields
  property_category: 'residential' | 'commercial';
  commercial_type: string;
  floor_size_sqft: string;
  building_floor: string;
  number_of_floors: string;
  parking_spaces: string;
  loading_dock: boolean;
  elevator_access: boolean;
  commercial_garage_entrance: boolean;
  climate_controlled: boolean;
  // Commercial Lease/Finance Fields
  lease_term_years: string;
  lease_type: string;
  financing_available: boolean;
  financing_details: string;
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
  const [isSuccess, setIsSuccess] = useState(false);
  
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
    land_size_na: false,
    year_built: "",
    amenities: [],
    region: "",
    city: "",
    neighborhood: "",
    address: "",
    show_address: false,
    lot_length: "",
    lot_width: "",
    lot_dimension_unit: "ft",
    owner_whatsapp: "",
    video_url: "",
    
    // Commercial Property Fields
    property_category: 'residential',
    commercial_type: '',
    floor_size_sqft: '',
    building_floor: '',
    number_of_floors: '',
    parking_spaces: '',
    loading_dock: false,
    elevator_access: false,
    commercial_garage_entrance: false,
    climate_controlled: false,
    
    // Commercial Lease/Finance Fields
    lease_term_years: '',
    lease_type: '',
    financing_available: false,
    financing_details: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("GY");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [currencyCode, setCurrencyCode] = useState<string>("GYD");
  const [currencySymbol, setCurrencySymbol] = useState<string>("GY$");

  // Track admin status for navigation and permissions
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLevel, setAdminLevel] = useState<string | null>(null);

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

        // First, check if user is an admin and get their profile
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('admin_level, country_id')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error loading user profile:', profileError);
        }

        const userAdminLevel = userProfile?.admin_level;
        const isUserAdmin = userAdminLevel && ['super', 'owner'].includes(userAdminLevel);
        setIsAdmin(!!isUserAdmin);
        setAdminLevel(userAdminLevel || null);

        // Build the property query - bypass user_id filter for admins
        let propertyQuery = supabase
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
          .eq('id', propertyId);

        // Apply access control based on user type
        if (isUserAdmin) {
          // Super Admin can edit any property
          if (userAdminLevel === 'super') {
            console.log('🔓 Super Admin: Full edit access to all properties');
          }
          // Owner Admin can only edit properties in their country
          else if (userAdminLevel === 'owner' && userProfile?.country_id) {
            console.log(`🔓 Owner Admin: Edit access limited to country ${userProfile.country_id}`);
            propertyQuery = propertyQuery.eq('country_id', userProfile.country_id);
          }
        } else {
          // Regular users (including Basic Admin until permissions defined) can only edit their own properties
          // Regular users can only edit their own properties
          propertyQuery = propertyQuery.eq('user_id', user.id);
        }

        const { data: property, error: propertyError } = await propertyQuery.single();

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
            land_size_na: property.land_size_na || false,
            year_built: property.year_built?.toString() || '',
            amenities: Array.isArray(property.amenities) ? property.amenities : [],
            region: property.region || '',
            city: property.city || '',
            neighborhood: property.neighborhood || '',
            address: property.address || '',
            show_address: property.show_address || false,
            lot_length: property.lot_length?.toString() || '',
            lot_width: property.lot_width?.toString() || '',
            lot_dimension_unit: property.lot_dimension_unit || 'ft',
            owner_whatsapp: property.owner_whatsapp || '',
            video_url: property.video_url || '',
            
            // Commercial property fields
            property_category: property.property_category || 'residential',
            commercial_type: property.commercial_type || '',
            floor_size_sqft: property.floor_size_sqft?.toString() || '',
            building_floor: property.building_floor || '',
            number_of_floors: property.number_of_floors?.toString() || '',
            parking_spaces: property.parking_spaces?.toString() || '',
            loading_dock: property.loading_dock || false,
            elevator_access: property.elevator_access || false,
            commercial_garage_entrance: property.commercial_garage_entrance || false,
            climate_controlled: property.climate_controlled || false,
            
            // Lease and financing fields
            lease_term_years: property.lease_term_years || '',
            lease_type: property.lease_type || '',
            financing_available: property.financing_available || false,
            financing_details: property.financing_details || '',
          });

          // Set location and currency info - FIX: Use country field, not location
          // Handle legacy data where country might be null but location contains country code
          let countryCode = property.country || 'GY';
          if (!property.country && property.location) {
            // Extract country from location field (GY-R4 -> GY)
            if (property.location.startsWith('GY')) countryCode = 'GY';
            else if (property.location.startsWith('JM')) countryCode = 'JM';
          }
          setSelectedCountry(countryCode);
          
          // Map stored region code to component expected format
          let mappedRegion = property.region || '';
          if (mappedRegion && countryCode === 'GY') {
            // Map GY-R4 (Region 4 - Demerara-Mahaica) to city format
            const city = property.city || '';
            if (mappedRegion === 'GY-R4') {
              // Region 4 includes Georgetown, Diamond, East Coast Demerara, etc.
              if (city.includes('Georgetown')) {
                mappedRegion = 'GY-R4-Georgetown';
              } else {
                // Default Region 4 areas to Georgetown in the component
                mappedRegion = 'GY-R4-Georgetown';
              }
            } else if (mappedRegion === 'GY-R10' && city.includes('Linden')) {
              mappedRegion = 'GY-R10-Linden';
            } else if (mappedRegion === 'GY-R6' && city.includes('New Amsterdam')) {
              mappedRegion = 'GY-R6-NewAmsterdam';
            }
            console.log(`🗺️ Region mapping: ${property.region} + "${city}" -> ${mappedRegion} (country: ${countryCode})`);
          }
          setSelectedRegion(mappedRegion);
          
          setCurrencyCode(property.currency || 'GYD');
          setCurrencySymbol(getCurrencySymbol(property.currency || 'GYD'));
          
          // Also update the form location field
          setForm(prev => ({
            ...prev,
            location: countryCode
          }));

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
      // Special handling for property_category changes
      if (name === 'property_category') {
        // Reset property_type when category changes
        const newPropertyType = value === 'commercial' ? 'Office' : 'House';
        setForm({ 
          ...form, 
          [name]: value as 'residential' | 'commercial',
          property_type: newPropertyType,
          commercial_type: value === 'commercial' ? newPropertyType : ''
        });
      } else if (name === 'property_type' && form.property_category === 'commercial') {
        // Auto-sync property_type to commercial_type for commercial properties
        setForm({ 
          ...form, 
          [name]: value,
          commercial_type: value
        });
      } else {
        setForm({ ...form, [name]: value });
      }
    }
  };

  const handleLocationChange = (field: 'country' | 'region', value: string) => {
    if (field === 'country') {
      setSelectedCountry(value);
      setSelectedRegion('');
      setForm({ ...form, location: value, region: '' });
    } else {
      setSelectedRegion(value);
      // Convert component format to database format before storing in form
      let dbRegion = value;
      if (value && selectedCountry === 'GY') {
        if (value === 'GY-R4-Georgetown') dbRegion = 'GY-R4';
        else if (value === 'GY-R10-Linden') dbRegion = 'GY-R10';
        else if (value === 'GY-R6-NewAmsterdam') dbRegion = 'GY-R6';
      }
      setForm({ ...form, region: dbRegion });
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
      // Initialize Supabase client
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      // Upload new images directly to Supabase Storage (if any)
      let imageUrls: string[] = [];
      if (images.length > 0) {
        console.log('📤 Uploading new images directly to Supabase Storage...');
        const { uploadImagesToSupabase } = await import('@/lib/supabaseImageUpload');
        const uploadedImages = await uploadImagesToSupabase(images, user.id);
        imageUrls = uploadedImages.map(img => img.url);
        console.log(`✅ ${imageUrls.length} new images uploaded`);
      }

      // Prepare property data for update - FIX: Include all necessary fields
      const propertyData = {
        location: form.location || selectedCountry, // Use selected country as location
        title: form.title,
        description: form.description,
        price: parseFloat(form.price) || 0,
        property_type: form.property_type,
        listing_type: form.listing_type,
        bedrooms: parseInt(form.bedrooms) || null,
        bathrooms: parseFloat(form.bathrooms) || null,
        house_size_value: parseFloat(form.house_size_value) || null,
        house_size_unit: form.house_size_unit,
        land_size_value: form.land_size_na ? null : (parseFloat(form.land_size_value) || null),
        land_size_unit: form.land_size_unit,
        land_size_na: form.land_size_na,
        year_built: parseInt(form.year_built) || null,
        amenities: form.amenities,
        lot_length: parseFloat(form.lot_length) || null,
        lot_width: parseFloat(form.lot_width) || null,
        lot_dimension_unit: form.lot_dimension_unit,
        region: form.region, // Form already contains database format
        city: form.city,
        neighborhood: form.neighborhood,
        address: form.address,
        show_address: form.show_address,
        owner_whatsapp: form.owner_whatsapp,
        currency: currencyCode,
        country: selectedCountry, // FIX: Include country field
        site_id: selectedCountry === 'JM' ? 'jamaica' : 'guyana', // FIX: Include site_id for routing
        updated_at: new Date().toISOString(),
      };

      // Update property via API - send image URLs
      const response = await fetch(`/api/properties/update/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...propertyData,
          imageUrls: imageUrls // Send URLs of newly uploaded images
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update property');
      }

      // Set success state for button feedback
      setIsSuccess(true);
      
      // Enhanced success message with details
      const successMessage = result.status === 'active' 
        ? '✅ Property updated successfully! Your listing remains live on Guyana Home Hub.'
        : result.status === 'pending'
        ? '✅ Property updated successfully! Changes are pending admin approval.'
        : `✅ Property updated successfully! ${images.length > 0 ? `${images.length} new images uploaded.` : ''}`;
      
      setSuccess(successMessage);
      
      // Keep success feedback visible then redirect to appropriate dashboard
      setTimeout(() => {
        const dashboardUrl = isAdmin ? '/admin-dashboard/unified' : '/dashboard/agent';
        router.push(dashboardUrl);
      }, 2500);

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

  // Determine the correct dashboard URL based on admin status
  const getDashboardUrl = () => isAdmin ? '/admin-dashboard/unified' : '/dashboard/agent';

  if (error && !form.title) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push(getDashboardUrl())}
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
            <h1 className="text-3xl font-bold text-blue-600">
              {isAdmin ? '✏️ Admin: Edit Property' : 'Edit Property'}
            </h1>
            <button
              onClick={() => router.push(getDashboardUrl())}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Back to {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Category *</label>
                <select 
                  name="property_category" 
                  value={form.property_category} 
                  onChange={handleChange} 
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                >
                  <option value="residential">🏠 Residential</option>
                  <option value="commercial">🏢 Commercial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type *</label>
                <select 
                  name="property_type" 
                  value={form.property_type} 
                  onChange={handleChange} 
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                >
                  {form.property_category === 'residential' ? (
                    <>
                      <option value="House">🏠 House</option>
                      <option value="Apartment">🏢 Apartment</option>
                      <option value="Land">🌿 Land</option>
                    </>
                  ) : (
                    <>
                      <option value="Office">🏢 Office</option>
                      <option value="Retail">🏪 Retail</option>
                      <option value="Warehouse">🏭 Warehouse</option>
                      <option value="Industrial">⚙️ Industrial</option>
                      <option value="Mixed Use">🏬 Mixed Use</option>
                      <option value="Commercial Land">🌿 Commercial Land</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Listing Type *</label>
                <select 
                  name="listing_type" 
                  value={form.listing_type} 
                  onChange={handleChange} 
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                >
                  <option value="sale">🏠 For Sale</option>
                  {form.property_category === 'residential' && (
                    <option value="rent">🏡 For Rent</option>
                  )}
                  {form.property_category === 'commercial' && (
                    <option value="lease">🏢 For Lease</option>
                  )}
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
            
            {!form.land_size_na && (
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
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Total Land Area
                {!form.land_size_na && form.lot_length && form.lot_width && (
                  <span className="text-green-600 text-xs ml-2">⚡ Auto-calculated from dimensions above</span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  name="land_size_value"
                  type="number"
                  placeholder={form.land_size_na ? 'N/A' : 'Total area'}
                  value={form.land_size_na ? '' : form.land_size_value}
                  onChange={handleChange}
                  disabled={form.land_size_na}
                  className={`flex-1 px-4 py-3 border-2 rounded-lg text-gray-900 ${
                    form.land_size_na
                      ? 'border-gray-200 bg-gray-100 cursor-not-allowed text-gray-400'
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                <select
                  name="land_size_unit"
                  value={form.land_size_unit}
                  onChange={handleChange}
                  disabled={form.land_size_na}
                  className={`px-4 py-3 border-2 rounded-lg text-gray-900 ${
                    form.land_size_na
                      ? 'border-gray-200 bg-gray-100 cursor-not-allowed text-gray-400'
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                >
                  <option value="sq ft">sq ft</option>
                  <option value="sq m">sq m</option>
                  <option value="acres">acres</option>
                  <option value="hectares">hectares</option>
                </select>
              </div>
              {/* N/A Checkbox */}
              <label className="flex items-center gap-2 mt-2 cursor-pointer group">
                <input
                  type="checkbox"
                  name="land_size_na"
                  checked={form.land_size_na}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setForm(prev => ({
                      ...prev,
                      land_size_na: isChecked,
                      land_size_value: isChecked ? '' : prev.land_size_value,
                      lot_length: isChecked ? '' : prev.lot_length,
                      lot_width: isChecked ? '' : prev.lot_width
                    }));
                  }}
                  className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-800">
                  Not applicable (e.g., apartment/unit rentals)
                </span>
              </label>
              {!form.land_size_na && (
                <p className="text-xs text-gray-700 mt-1">
                  Editable for irregular lots or manual override
                </p>
              )}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Neighborhood/Area <span className="text-red-500">*</span>
                </label>
                <input
                  name="neighborhood"
                  type="text"
                  placeholder="e.g., Lamaha Gardens, Kitty, Bel Air Park, Eccles"
                  value={form.neighborhood}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={100}
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">This will be shown publicly on your listing</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address (Optional)
              </label>
              <input
                name="address"
                type="text"
                placeholder="e.g., 123 Main Street"
                value={form.address}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id="show_address"
                name="show_address"
                checked={form.show_address}
                onChange={(e) => setForm({ ...form, show_address: e.target.checked })}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <label htmlFor="show_address" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Show street address publicly on listing
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  If unchecked, only the neighborhood will display. Buyers will see "Contact agent for exact address"
                </p>
              </div>
            </div>
          </div>

          {/* 4.5. COMMERCIAL FEATURES (Commercial Properties Only) */}
          {form.property_category === 'commercial' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-indigo-500">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                🏢 Commercial Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Commercial Type</label>
                  <select 
                    name="commercial_type" 
                    value={form.commercial_type} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                  >
                    <option value="">Select Type</option>
                    <option value="Office">Office</option>
                    <option value="Retail">Retail</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Mixed Use">Mixed Use</option>
                    <option value="Medical">Medical</option>
                    <option value="Restaurant">Restaurant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Floor Size (sq ft)</label>
                  <input 
                    name="floor_size_sqft" 
                    type="number" 
                    placeholder="e.g., 2500" 
                    value={form.floor_size_sqft} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Floor Level</label>
                  <input 
                    name="building_floor" 
                    type="text" 
                    placeholder="Ground, 2nd, etc." 
                    value={form.building_floor} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Floors</label>
                  <input 
                    name="number_of_floors" 
                    type="number" 
                    placeholder="e.g., 3" 
                    value={form.number_of_floors} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Parking Spaces</label>
                  <input 
                    name="parking_spaces" 
                    type="number" 
                    placeholder="e.g., 10" 
                    value={form.parking_spaces} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                  />
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="loading_dock"
                    checked={form.loading_dock}
                    onChange={(e) => setForm({ ...form, loading_dock: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">Loading Dock</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="elevator_access"
                    checked={form.elevator_access}
                    onChange={(e) => setForm({ ...form, elevator_access: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">Elevator Access</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="climate_controlled"
                    checked={form.climate_controlled}
                    onChange={(e) => setForm({ ...form, climate_controlled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">Climate Controlled</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="commercial_garage_entrance"
                    checked={form.commercial_garage_entrance}
                    onChange={(e) => setForm({ ...form, commercial_garage_entrance: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">Garage Entrance</label>
                </div>
              </div>

              {/* Lease Terms for Commercial Properties */}
              {form.listing_type === 'lease' && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <h4 className="text-lg font-medium text-green-900 mb-4">📋 Lease Terms</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lease Term (Years)</label>
                      <select 
                        name="lease_term_years" 
                        value={form.lease_term_years} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                      >
                        <option value="">Select Term</option>
                        <option value="1">1 Year</option>
                        <option value="2">2 Years</option>
                        <option value="3">3 Years</option>
                        <option value="5">5 Years</option>
                        <option value="10">10 Years</option>
                        <option value="15">15 Years</option>
                        <option value="20">20 Years</option>
                        <option value="99">99 Years</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lease Type</label>
                      <select 
                        name="lease_type" 
                        value={form.lease_type} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                      >
                        <option value="">Select Type</option>
                        <option value="Triple Net (NNN)">Triple Net (NNN)</option>
                        <option value="Gross Lease">Gross Lease</option>
                        <option value="Modified Gross">Modified Gross</option>
                        <option value="Percentage Lease">Percentage Lease</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Financing Options */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-lg font-medium text-blue-900 mb-4">💰 Financing Options</h4>
                <div className="mb-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="financing_available"
                      checked={form.financing_available}
                      onChange={(e) => setForm({ ...form, financing_available: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-gray-700">Financing Available</label>
                  </div>
                </div>
                
                {form.financing_available && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Financing Details</label>
                    <textarea
                      name="financing_details"
                      value={form.financing_details}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Describe financing options, down payment requirements, terms, etc."
                      className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

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
              disabled={isSubmitting || isSuccess}
              className={`px-8 py-4 text-white rounded-lg font-semibold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                isSuccess 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSuccess ? (
                <span className="flex items-center justify-center gap-2">
                  ✅ Property Updated Successfully!
                </span>
              ) : isSubmitting ? (
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