'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/supabase';
import CompletionIncentive, { CompletionProgress } from "@/components/CompletionIncentive";
import { calculateCompletionScore, getUserMotivation } from "@/lib/completionUtils";
import { normalizePropertyData, getPropertyTypeLabel, getAmenityLabels } from "@/lib/propertyNormalization";

// Reusing existing agent create-property components  
import GlobalSouthLocationSelector from "@/components/GlobalSouthLocationSelector";
import EnhancedImageUpload from "@/components/EnhancedImageUpload";
import AmenitiesSelector from "@/components/AmenitiesSelector";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import AIDescriptionAssistant from "@/components/AIDescriptionAssistant";
import AITitleSuggester from "@/components/AITitleSuggester";
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
  const searchParams = useSearchParams();
  const propertyId = params?.id as string;
  const isViewMode = searchParams?.get('mode') === 'view';

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

  // View mode: realtime update toast
  const [realtimeToast, setRealtimeToast] = useState<string | null>(null);
  // View mode: access denied for non-owners
  const [viewAccessDenied, setViewAccessDenied] = useState(false);
  // Store the property owner name for display in view mode
  const [ownerName, setOwnerName] = useState<string>('');
  const [propertyCreatedAt, setPropertyCreatedAt] = useState<string>('');
  const [propertyUpdatedAt, setPropertyUpdatedAt] = useState<string>('');

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
          // Regular users can only access their own properties
          propertyQuery = propertyQuery.eq('user_id', user.id);
        }

        const { data: property, error: propertyError } = await propertyQuery.single();

        if (propertyError) {
          console.error('Error loading property:', propertyError);
          // In view mode, show a specific access denied message for non-admins
          if (isViewMode && !isUserAdmin) {
            setViewAccessDenied(true);
            setLoading(false);
            return;
          }
          setError('Property not found or access denied');
          return;
        }

        if (property) {
          // Normalize property data for backward compatibility with old values
          const normalizedProperty = normalizePropertyData(property);

          // Populate form data from existing property
          setForm({
            location: normalizedProperty.location || '',
            title: normalizedProperty.title || '',
            description: normalizedProperty.description || '',
            price: normalizedProperty.price?.toString() || '',
            status: normalizedProperty.status || 'draft',
            property_type: normalizedProperty.property_type || 'House',
            listing_type: normalizedProperty.listing_type || 'sale',
            bedrooms: normalizedProperty.bedrooms?.toString() || '',
            bathrooms: normalizedProperty.bathrooms?.toString() || '',
            house_size_value: normalizedProperty.house_size_value?.toString() || '',
            house_size_unit: normalizedProperty.house_size_unit || 'sq ft',
            land_size_value: normalizedProperty.land_size_value?.toString() || '',
            land_size_unit: normalizedProperty.land_size_unit || 'sq ft',
            land_size_na: normalizedProperty.land_size_na || false,
            year_built: normalizedProperty.year_built?.toString() || '',
            amenities: Array.isArray(normalizedProperty.amenities) ? normalizedProperty.amenities : [],
            region: normalizedProperty.region || '',
            city: normalizedProperty.city || '',
            neighborhood: normalizedProperty.neighborhood || '',
            address: normalizedProperty.address || '',
            show_address: normalizedProperty.show_address || false,
            lot_length: normalizedProperty.lot_length?.toString() || '',
            lot_width: normalizedProperty.lot_width?.toString() || '',
            lot_dimension_unit: normalizedProperty.lot_dimension_unit || 'ft',
            owner_whatsapp: normalizedProperty.owner_whatsapp || '',
            video_url: normalizedProperty.video_url || '',

            // Commercial property fields
            property_category: normalizedProperty.property_category || 'residential',
            commercial_type: normalizedProperty.commercial_type || '',
            floor_size_sqft: normalizedProperty.floor_size_sqft?.toString() || '',
            building_floor: normalizedProperty.building_floor || '',
            number_of_floors: normalizedProperty.number_of_floors?.toString() || '',
            parking_spaces: normalizedProperty.parking_spaces?.toString() || '',
            loading_dock: normalizedProperty.loading_dock || false,
            elevator_access: normalizedProperty.elevator_access || false,
            commercial_garage_entrance: normalizedProperty.commercial_garage_entrance || false,
            climate_controlled: normalizedProperty.climate_controlled || false,

            // Lease and financing fields
            lease_term_years: normalizedProperty.lease_term_years || '',
            lease_type: normalizedProperty.lease_type || '',
            financing_available: normalizedProperty.financing_available || false,
            financing_details: normalizedProperty.financing_details || '',
          });

          // Set location and currency info - FIX: Use country field, not location
          // Handle legacy data where country might be null but location contains country code
          let countryCode = normalizedProperty.country || 'GY';
          if (!normalizedProperty.country && normalizedProperty.location) {
            // Extract country from location field (GY-R4 -> GY)
            if (normalizedProperty.location.startsWith('GY')) countryCode = 'GY';
            else if (normalizedProperty.location.startsWith('JM')) countryCode = 'JM';
          }
          setSelectedCountry(countryCode);

          // Map stored region code to component expected format
          let mappedRegion = normalizedProperty.region || '';
          if (mappedRegion && countryCode === 'GY') {
            // Map GY-R4 (Region 4 - Demerara-Mahaica) to city format
            const city = normalizedProperty.city || '';
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
            console.log(`🗺️ Region mapping: ${normalizedProperty.region} + "${city}" -> ${mappedRegion} (country: ${countryCode})`);
          }
          setSelectedRegion(mappedRegion);

          setCurrencyCode(normalizedProperty.currency || 'GYD');
          setCurrencySymbol(getCurrencySymbol(normalizedProperty.currency || 'GYD'));
          
          // Also update the form location field
          setForm(prev => ({
            ...prev,
            location: countryCode
          }));

          // Set existing images (property_media is not normalized, use original)
          const propertyImages = property.property_media
            ?.filter((media: any) => media.media_type === 'image')
            ?.sort((a: any, b: any) => {
              if (a.is_primary && !b.is_primary) return -1;
              if (!a.is_primary && b.is_primary) return 1;
              return a.display_order - b.display_order;
            })
            ?.map((media: any) => media.media_url) || [];

          setExistingImages(propertyImages);

          // Capture metadata for view mode
          setPropertyCreatedAt(property.created_at || '');
          setPropertyUpdatedAt(property.updated_at || '');

          // Fetch owner name for view mode display
          if (property.user_id) {
            const { data: ownerProfile } = await supabase
              .from('profiles')
              .select('first_name, last_name, email')
              .eq('id', property.user_id)
              .single();
            if (ownerProfile) {
              const name = [ownerProfile.first_name, ownerProfile.last_name].filter(Boolean).join(' ');
              setOwnerName(name || ownerProfile.email || 'Unknown');
            }
          }
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

  // Supabase Realtime: subscribe to property changes in view mode
  useEffect(() => {
    if (!isViewMode || !propertyId) return;

    const channel = supabase
      .channel(`property-view-${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'properties',
          filter: `id=eq.${propertyId}`,
        },
        async (payload) => {
          const updated = payload.new as any;
          const normalized = normalizePropertyData(updated);

          // Update form state with new data
          setForm({
            location: normalized.location || '',
            title: normalized.title || '',
            description: normalized.description || '',
            price: normalized.price?.toString() || '',
            status: normalized.status || 'draft',
            property_type: normalized.property_type || 'House',
            listing_type: normalized.listing_type || 'sale',
            bedrooms: normalized.bedrooms?.toString() || '',
            bathrooms: normalized.bathrooms?.toString() || '',
            house_size_value: normalized.house_size_value?.toString() || '',
            house_size_unit: normalized.house_size_unit || 'sq ft',
            land_size_value: normalized.land_size_value?.toString() || '',
            land_size_unit: normalized.land_size_unit || 'sq ft',
            land_size_na: normalized.land_size_na || false,
            year_built: normalized.year_built?.toString() || '',
            amenities: Array.isArray(normalized.amenities) ? normalized.amenities : [],
            region: normalized.region || '',
            city: normalized.city || '',
            neighborhood: normalized.neighborhood || '',
            address: normalized.address || '',
            show_address: normalized.show_address || false,
            lot_length: normalized.lot_length?.toString() || '',
            lot_width: normalized.lot_width?.toString() || '',
            lot_dimension_unit: normalized.lot_dimension_unit || 'ft',
            owner_whatsapp: normalized.owner_whatsapp || '',
            video_url: normalized.video_url || '',
            property_category: normalized.property_category || 'residential',
            commercial_type: normalized.commercial_type || '',
            floor_size_sqft: normalized.floor_size_sqft?.toString() || '',
            building_floor: normalized.building_floor || '',
            number_of_floors: normalized.number_of_floors?.toString() || '',
            parking_spaces: normalized.parking_spaces?.toString() || '',
            loading_dock: normalized.loading_dock || false,
            elevator_access: normalized.elevator_access || false,
            commercial_garage_entrance: normalized.commercial_garage_entrance || false,
            climate_controlled: normalized.climate_controlled || false,
            lease_term_years: normalized.lease_term_years || '',
            lease_type: normalized.lease_type || '',
            financing_available: normalized.financing_available || false,
            financing_details: normalized.financing_details || '',
          });
          setPropertyUpdatedAt(updated.updated_at || '');

          // Resolve the updater's name
          let updaterName = 'someone';
          if (updated.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', updated.user_id)
              .single();
            if (profile) {
              updaterName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'someone';
            }
          }

          setRealtimeToast(`Property updated by ${updaterName} just now`);
          setTimeout(() => setRealtimeToast(null), 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isViewMode, propertyId, supabase]);

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
        video_url: form.video_url || null,
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

  // Helper to render a labeled field in view mode
  const ViewField = ({ label, value, className = '' }: { label: string; value: string | number | undefined; className?: string }) => {
    if (!value && value !== 0) return null;
    return (
      <div className={className}>
        <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{value}</dd>
      </div>
    );
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    draft: 'bg-gray-100 text-gray-800',
    rejected: 'bg-red-100 text-red-800',
    under_contract: 'bg-blue-100 text-blue-800',
    sold: 'bg-purple-100 text-purple-800',
    rented: 'bg-indigo-100 text-indigo-800',
    off_market: 'bg-orange-100 text-orange-800',
  };

  // ─── VIEW MODE ────────────────────────────────────────────────────────────────
  if (isViewMode) {
    // Security: block non-owners from viewing other agents' properties
    if (viewAccessDenied) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              You can only view your own properties. This property belongs to another user.
            </p>
            <button
              onClick={() => router.back()}
              className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }

    const switchToEditUrl = `/dashboard/agent/edit-property/${propertyId}`;
    const formattedPrice = form.price ? formatCurrency(parseFloat(form.price), currencyCode) : 'N/A';
    const amenityLabels = form.amenities.length > 0 ? getAmenityLabels(form.amenities) : [];

    return (
      <>
        {/* Print-only styles */}
        <style jsx global>{`
          @media print {
            /* Hide non-content elements */
            .no-print, nav, header, footer, .sticky { display: none !important; }
            /* Clean layout */
            body { background: white !important; color: black !important; font-size: 12pt; }
            .print-container { max-width: 100% !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; }
            .print-container * { box-shadow: none !important; }
            /* Images */
            .print-images img { break-inside: avoid; max-height: 200px; }
            .print-images { grid-template-columns: repeat(3, 1fr) !important; }
            /* Page header/footer */
            .print-header { display: block !important; }
            .print-footer { display: block !important; position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 10pt; color: #666; border-top: 1px solid #ccc; padding-top: 8px; }
            /* Section borders */
            .view-section { border: 1px solid #e5e7eb !important; break-inside: avoid; }
          }
        `}</style>

        <div className="min-h-screen bg-gray-50">
          {/* Realtime update toast */}
          {realtimeToast && (
            <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse no-print">
              <span>🔄</span>
              <span className="text-sm font-medium">{realtimeToast}</span>
            </div>
          )}

          {/* Print-only header (hidden on screen) */}
          <div className="print-header hidden">
            <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #2563eb' }}>
              <h1 style={{ fontSize: '20pt', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>Portal Home Hub</h1>
              <p style={{ fontSize: '11pt', color: '#666', margin: '4px 0 0 0' }}>Property Report</p>
            </div>
          </div>

          {/* Header bar */}
          <div className="bg-white shadow-sm sticky top-0 z-10 no-print">
            <div className="max-w-4xl mx-auto px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">Property Details</h1>
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full border border-gray-200">View Only</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    🖨️ Print Property Report
                  </button>
                  <a
                    href={switchToEditUrl}
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    ✏️ Switch to Edit Mode
                  </a>
                  <button
                    onClick={() => router.push(getDashboardUrl())}
                    className="text-gray-600 hover:text-gray-800 font-medium text-sm ml-2"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="max-w-4xl mx-auto px-6 py-8 print-container">
            {/* Title & Status header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 view-section">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{form.title || 'Untitled Property'}</h2>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColors[form.status] || 'bg-gray-100 text-gray-700'}`}>
                      {form.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span>{getPropertyTypeLabel(form.property_type)}</span>
                    <span>•</span>
                    <span className="capitalize">{form.property_category}</span>
                    <span>•</span>
                    <span>For {form.listing_type === 'lease' ? 'Lease' : form.listing_type === 'rent' ? 'Rent' : 'Sale'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-green-700">{formattedPrice}</div>
                  {form.listing_type === 'rent' || form.listing_type === 'lease' ? (
                    <div className="text-xs text-gray-500">per month</div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Property Images */}
            {existingImages.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 view-section">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📸 Photos ({existingImages.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 print-images">
                  {existingImages.map((url, i) => (
                    <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                      <img src={url} alt={`Property photo ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">Primary</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 view-section">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📐 Specifications</h3>
              <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <ViewField label="Bedrooms" value={form.bedrooms || undefined} />
                <ViewField label="Bathrooms" value={form.bathrooms || undefined} />
                {form.house_size_value && (
                  <ViewField label="House Size" value={`${form.house_size_value} ${form.house_size_unit}`} />
                )}
                {!form.land_size_na && form.land_size_value && (
                  <ViewField label="Land Size" value={`${form.land_size_value} ${form.land_size_unit}`} />
                )}
                {form.land_size_na && (
                  <ViewField label="Land Size" value="N/A" />
                )}
                {(form.lot_length && form.lot_width) && (
                  <ViewField label="Lot Dimensions" value={`${form.lot_length} x ${form.lot_width} ${form.lot_dimension_unit}`} />
                )}
                <ViewField label="Year Built" value={form.year_built || undefined} />
              </dl>
            </div>

            {/* Location */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 view-section">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📍 Location</h3>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                <ViewField label="Country" value={selectedCountry} />
                <ViewField label="Region" value={form.region || undefined} />
                <ViewField label="City" value={form.city || undefined} />
                <ViewField label="Neighborhood" value={form.neighborhood || undefined} />
                {form.show_address && form.address && (
                  <ViewField label="Address" value={form.address} className="col-span-2" />
                )}
              </dl>
            </div>

            {/* Description */}
            {form.description && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 view-section">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Description</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{form.description}</p>
              </div>
            )}

            {/* Amenities */}
            {amenityLabels.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 view-section">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">✨ Amenities & Features</h3>
                <div className="flex flex-wrap gap-2">
                  {amenityLabels.map((label, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200">{label}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Commercial Details (conditional) */}
            {form.property_category === 'commercial' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 view-section">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 Commercial Details</h3>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  <ViewField label="Commercial Type" value={form.commercial_type || undefined} />
                  <ViewField label="Floor Size" value={form.floor_size_sqft ? `${form.floor_size_sqft} sq ft` : undefined} />
                  <ViewField label="Building Floor" value={form.building_floor || undefined} />
                  <ViewField label="Number of Floors" value={form.number_of_floors || undefined} />
                  <ViewField label="Parking Spaces" value={form.parking_spaces || undefined} />
                  {form.loading_dock && <ViewField label="Loading Dock" value="Yes" />}
                  {form.elevator_access && <ViewField label="Elevator Access" value="Yes" />}
                  {form.climate_controlled && <ViewField label="Climate Controlled" value="Yes" />}
                  {form.commercial_garage_entrance && <ViewField label="Garage Entrance" value="Yes" />}
                </dl>
                {(form.listing_type === 'lease') && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Lease Terms</h4>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <ViewField label="Lease Term" value={form.lease_term_years ? `${form.lease_term_years} years` : undefined} />
                      <ViewField label="Lease Type" value={form.lease_type || undefined} />
                    </dl>
                  </div>
                )}
                {form.financing_available && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Financing</h4>
                    <ViewField label="Financing Available" value="Yes" />
                    {form.financing_details && <ViewField label="Details" value={form.financing_details} className="mt-2" />}
                  </div>
                )}
              </div>
            )}

            {/* Contact & Owner Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 view-section">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">👤 Owner & Contact</h3>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                <ViewField label="Owner" value={ownerName || undefined} />
                <ViewField label="WhatsApp" value={form.owner_whatsapp || undefined} />
                {form.video_url && <ViewField label="Video URL" value={form.video_url} className="col-span-2" />}
              </dl>
            </div>

            {/* Listing History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 view-section">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Listing History</h3>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                <ViewField label="Property ID" value={propertyId} />
                {propertyCreatedAt && (
                  <ViewField label="Created" value={new Date(propertyCreatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                )}
                {propertyUpdatedAt && (
                  <ViewField label="Last Updated" value={new Date(propertyUpdatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} />
                )}
              </dl>
            </div>
          </div>

          {/* Print-only footer (hidden on screen) */}
          <div className="print-footer hidden">
            <p>Generated from Portal Home Hub • portalhomehub.com • {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </>
    );
  }
  // ─── END VIEW MODE ──────────────────────────────────────────────────────────

  const isLandProperty = ['land', 'residential land', 'commercial land'].includes(form.property_type?.toLowerCase() || '');

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
                  maxLength={100}
                />
                <p className="text-sm text-gray-500 mt-1">{form.title?.length || 0}/100 characters</p>

                {/* AI Title Suggester */}
                <AITitleSuggester
                  propertyData={{
                    propertyType: form.property_type || '',
                    propertyCategory: form.property_category || 'residential',
                    listingType: form.listing_type || 'sale',
                    bedrooms: form.bedrooms || '',
                    bathrooms: form.bathrooms || '',
                    commercialType: form.commercial_type || '',
                    floorSize: form.floor_size_sqft || '',
                    price: form.price || '',
                    location: form.city || selectedRegion || '',
                    neighborhood: form.neighborhood || '',
                    features: form.amenities || [],
                  }}
                  onTitleSelected={(title) => setForm(prev => ({...prev, title}))}
                  currentTitle={form.title || ''}
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
                    onDescriptionGenerated={(description) => setForm(prev => ({...prev, description}))}
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
              {/* Bedrooms & Bathrooms - hidden for land properties */}
              {!isLandProperty && (
                <>
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
                </>
              )}
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
            
            {/* Year Built - hidden for land properties */}
            {!isLandProperty && (
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
            )}
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
                Street Address
              </label>
              <input
                name="address"
                type="text"
                placeholder="e.g., 123 Main Street"
                value={form.address}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
              />
              <div className="text-xs bg-gray-100 p-2 rounded mt-2">
                <span className="font-semibold text-gray-800">🔒 NEVER shown publicly.</span>
                <span className="text-gray-600"> For verification only (fraud prevention, legal compliance).</span>
              </div>
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

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Current Photos ({existingImages.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {existingImages.map((url, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={url}
                        alt={`Property image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {index === 0 && (
                        <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  These images are already saved. Add new images below to include them.
                </p>
              </div>
            )}

            {/* Upload New Images */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                {existingImages.length > 0 ? 'Add New Photos' : 'Upload Photos'}
              </h4>
              <EnhancedImageUpload
                images={images}
                setImages={setImages}
                maxImages={25}
              />
            </div>

            {/* Video Tour (Optional) */}
            <div className="border border-gray-200 rounded-lg p-4 mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video Tour (Optional)
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Add a YouTube or Vimeo link to showcase your property.
                On your phone? <a href="https://studio.youtube.com/channel/UC/videos/upload" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Upload to YouTube</a> first, then paste the link here.
              </p>
              <input
                type="url"
                name="video_url"
                value={form.video_url}
                onChange={handleChange}
                onBlur={(e) => {
                  const url = e.target.value.trim();
                  if (url && !url.match(/youtube\.com|youtu\.be|vimeo\.com/i)) {
                    setError('Video URL: Please enter a YouTube or Vimeo URL');
                  }
                }}
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste a YouTube or Vimeo URL. Video will display on your listing.
              </p>
            </div>
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