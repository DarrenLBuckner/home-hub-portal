'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/supabase';

// Reusing existing owner create-property components (landlord components don't exist)
import Step1BasicInfo from '../../../owner/create-property/components/Step1BasicInfo';
import Step2Details from '../../../owner/create-property/components/Step2Details';
import Step3Location from '../../../owner/create-property/components/Step3Location';
import Step4Photos from '../../../owner/create-property/components/Step4Photos';
import Step5Contact from '../../../owner/create-property/components/Step5Contact';
import Step6Review from '../../../owner/create-property/components/Step6Review';
import { normalizePropertyData } from '@/lib/propertyNormalization';

export default function EditLandlordProperty() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id as string;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const submittingRef = useRef(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    description: '',
    price: '',
    property_type: 'Apartment',
    
    // Rental-specific
    lease_term_years: '',
    deposit_amount: '',
    utilities_included: [],
    pet_policy: '',
    available_from: '',
    
    // Property Details
    bedrooms: '',
    bathrooms: '',
    house_size_value: '',
    house_size_unit: 'sq ft',
    land_size_value: '',
    land_size_unit: 'sq ft',
    land_size_na: false,
    year_built: '',
    amenities: [],
    
    // Lot Dimensions
    lot_length: '',
    lot_width: '',
    lot_dimension_unit: 'ft',
    
    // Location
    country: 'GY',
    region: '',
    city: '',
    neighborhood: '',
    address: '',
    show_address: false,
    location: '',
    currency: 'GYD',

    // Contact - using field names that match Step5Contact and API
    owner_email: '',
    owner_whatsapp: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Track admin status for navigation and permissions
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLevel, setAdminLevel] = useState<string | null>(null);

  const supabase = createClient();

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Load existing property data
  useEffect(() => {
    async function loadPropertyData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // First, check if user is an admin
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
          if (userAdminLevel === 'super') {
            console.log('🔓 Super Admin: Full edit access to all properties');
          } else if (userAdminLevel === 'owner' && userProfile?.country_id) {
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
          // Normalize property data for backward compatibility with old values
          const normalizedProperty = normalizePropertyData(property);

          // Populate form data from existing property
          setFormData({
            title: normalizedProperty.title || '',
            description: normalizedProperty.description || '',
            price: normalizedProperty.price?.toString() || '',
            property_type: normalizedProperty.property_type || 'Apartment',
            lease_term_years: normalizedProperty.lease_term_years || '',
            deposit_amount: normalizedProperty.deposit_amount?.toString() || '',
            utilities_included: Array.isArray(normalizedProperty.utilities_included) ? normalizedProperty.utilities_included : [],
            pet_policy: normalizedProperty.pet_policy || '',
            bedrooms: normalizedProperty.bedrooms?.toString() || '',
            bathrooms: normalizedProperty.bathrooms?.toString() || '',
            house_size_value: normalizedProperty.house_size_value?.toString() || '',
            house_size_unit: normalizedProperty.house_size_unit || 'sq ft',
            land_size_value: normalizedProperty.land_size_value?.toString() || '',
            land_size_unit: normalizedProperty.land_size_unit || 'sq ft',
            land_size_na: normalizedProperty.land_size_na || false,
            year_built: normalizedProperty.year_built?.toString() || '',
            amenities: Array.isArray(normalizedProperty.amenities) ? normalizedProperty.amenities : [],
            lot_length: normalizedProperty.lot_length?.toString() || '',
            lot_width: normalizedProperty.lot_width?.toString() || '',
            lot_dimension_unit: normalizedProperty.lot_dimension_unit || 'ft',
            country: normalizedProperty.country_id || normalizedProperty.country || 'GY',
            region: normalizedProperty.region || '',
            city: normalizedProperty.city || '',
            neighborhood: normalizedProperty.neighborhood || '',
            address: normalizedProperty.address || '',
            show_address: normalizedProperty.show_address || false,
            location: normalizedProperty.location || '',
            currency: normalizedProperty.currency || 'GYD',
            owner_email: normalizedProperty.owner_email || '',
            owner_whatsapp: normalizedProperty.owner_whatsapp || '',
            available_from: normalizedProperty.available_from || '',
          });

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

  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
      setError('');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const updateFormData = (field: any, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
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
        property_type: formData.property_type,
        lease_term_years: formData.lease_term_years,
        deposit_amount: parseFloat(formData.deposit_amount) || null,
        utilities_included: formData.utilities_included,
        pet_policy: formData.pet_policy,
        bedrooms: parseInt(formData.bedrooms) || null,
        bathrooms: parseFloat(formData.bathrooms) || null,
        house_size_value: parseFloat(formData.house_size_value) || null,
        house_size_unit: formData.house_size_unit,
        land_size_value: parseFloat(formData.land_size_value) || null,
        land_size_unit: formData.land_size_unit,
        year_built: parseInt(formData.year_built) || null,
        amenities: formData.amenities,
        lot_length: parseFloat(formData.lot_length) || null,
        lot_width: parseFloat(formData.lot_width) || null,
        lot_dimension_unit: formData.lot_dimension_unit,
        country: formData.country,
        region: formData.region,
        city: formData.city,
        neighborhood: formData.neighborhood,
        address: formData.address,
        show_address: formData.show_address,
        location: formData.location,
        currency: formData.currency,
        owner_email: formData.owner_email,
        owner_whatsapp: formData.owner_whatsapp,
        listing_type: 'rent', // Landlord properties are always rentals
        available_from: formData.available_from || null,
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

      // Success! Redirect back to appropriate dashboard
      const dashboardUrl = isAdmin ? '/admin-dashboard/unified' : '/dashboard/landlord?updated=true';
      router.push(dashboardUrl);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rental property data...</p>
        </div>
      </div>
    );
  }

  // Determine the correct dashboard URL based on admin status
  const getDashboardUrl = () => isAdmin ? '/admin-dashboard/unified' : '/dashboard/landlord';

  if (error && !formData.title) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push(getDashboardUrl())}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Back to {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
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
            <h1 className="text-2xl font-bold text-green-700">
              {isAdmin ? '✏️ Admin: Edit Rental Property' : 'Edit Rental Property'}
            </h1>
            <button
              onClick={() => router.push(getDashboardUrl())}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Step {currentStep} of 6</span>
              <span className="text-sm text-gray-600">{Math.round((currentStep / 6) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(currentStep / 6) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {currentStep === 1 && (
            <Step1BasicInfo 
              formData={formData}
              setFormData={setFormData}
            />
          )}
          
          {currentStep === 2 && (
            <Step2Details 
              formData={formData}
              setFormData={setFormData}
            />
          )}
          
          {currentStep === 3 && (
            <Step3Location 
              formData={formData}
              setFormData={setFormData}
            />
          )}
          
          {currentStep === 4 && (
            <Step4Photos 
              images={images}
              setImages={setImages}
            />
          )}
          
          {currentStep === 5 && (
            <Step5Contact 
              formData={formData}
              setFormData={setFormData}
            />
          )}
          
          {currentStep === 6 && (
            <Step6Review 
              formData={formData}
              images={images}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          {currentStep < 6 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Rental Property'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}