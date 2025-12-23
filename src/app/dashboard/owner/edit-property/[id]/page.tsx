'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/supabase';
import CompletionIncentive, { CompletionProgress } from "@/components/CompletionIncentive";
import { calculateCompletionScore, getUserMotivation } from "@/lib/completionUtils";

// Step components - reusing existing components from create-property
import Step1BasicInfo from '../../create-property/components/Step1BasicInfo';
import Step2Details from '../../create-property/components/Step2Details';
import Step3Location from '../../create-property/components/Step3Location';
import Step4Photos from '../../create-property/components/Step4Photos';
import Step5Contact from '../../create-property/components/Step5Contact';
import Step6Review from '../../create-property/components/Step6Review';

export default function EditFSBOProperty() {
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
    property_type: 'Single Family Home',
    
    // Property Details
    bedrooms: '',
    bathrooms: '',
    house_size_value: '',
    house_size_unit: 'sq ft',
    land_size_value: '',
    land_size_unit: 'sq ft',
    year_built: '',
    amenities: [],
    
    // Lot Dimensions
    lot_length: '',
    lot_width: '',
    lot_dimension_unit: 'ft',
    
    // Location
    region: '',
    city: '',
    neighborhood: '',
    address: '',
    location: '',
    
    // Contact - populated from user profile
    contact_name: '',
    contact_phone: '',
    contact_email: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
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
            property_type: property.property_type || 'Single Family Home',
            bedrooms: property.bedrooms?.toString() || '',
            bathrooms: property.bathrooms?.toString() || '',
            house_size_value: property.house_size_value?.toString() || '',
            house_size_unit: property.house_size_unit || 'sq ft',
            land_size_value: property.land_size_value?.toString() || '',
            land_size_unit: property.land_size_unit || 'sq ft',
            year_built: property.year_built?.toString() || '',
            amenities: Array.isArray(property.amenities) ? property.amenities : [],
            lot_length: property.lot_length?.toString() || '',
            lot_width: property.lot_width?.toString() || '',
            lot_dimension_unit: property.lot_dimension_unit || 'ft',
            region: property.region || '',
            city: property.city || '',
            neighborhood: property.neighborhood || '',
            address: property.address || '',
            location: property.location || '',
            contact_name: property.contact_name || '',
            contact_phone: property.contact_phone || '',
            contact_email: property.contact_email || '',
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

  // Calculate completion score
  const completionAnalysis = calculateCompletionScore({
    ...formData,
    images: images as File[],
    amenities: Array.isArray(formData.amenities) ? formData.amenities : []
  });

  const userMotivation = getUserMotivation('fsbo');

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
        region: formData.region,
        city: formData.city,
        neighborhood: formData.neighborhood,
        address: formData.address,
        location: formData.location,
        contact_name: formData.contact_name,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
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

      // Success! Redirect back to dashboard
      router.push('/dashboard/owner?updated=true');

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

  if (error && !formData.title) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/dashboard/owner')}
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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
            <button
              onClick={() => router.push('/dashboard/owner')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Dashboard
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
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(currentStep / 6) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Completion Incentive */}
        <div className="mb-6">
          <CompletionProgress 
            completionAnalysis={completionAnalysis}
            userMotivation={userMotivation}
          />
        </div>

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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Property'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}