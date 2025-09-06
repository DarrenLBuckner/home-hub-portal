'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Step components
import Step1BasicInfo from './components/Step1BasicInfo';
import Step2Details from './components/Step2Details';
import Step3Location from './components/Step3Location';
import Step4Photos from './components/Step4Photos';
import Step5Contact from './components/Step5Contact';
import Step6Review from './components/Step6Review';

export default function CreateFSBOProperty() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    
    // Location
    region: '',
    city: '',
    neighborhood: '',
    
    // Contact
    owner_email: '',
    owner_whatsapp: '',
    
    // Hidden fields
    listing_type: 'sale',
    listed_by_type: 'owner',
    status: 'pending'
  });
  
  const [images, setImages] = useState([]);

  const validateCurrentStep = () => {
    setError('');
    
    switch (currentStep) {
      case 1:
        if (!formData.title.trim()) {
          setError('Property title is required');
          return false;
        }
        if (!formData.description.trim()) {
          setError('Property description is required');
          return false;
        }
        if (!formData.price || isNaN(Number(formData.price))) {
          setError('Valid price is required');
          return false;
        }
        break;
      case 2:
        if (!formData.bedrooms || isNaN(Number(formData.bedrooms))) {
          setError('Number of bedrooms is required');
          return false;
        }
        if (!formData.bathrooms || isNaN(Number(formData.bathrooms))) {
          setError('Number of bathrooms is required');
          return false;
        }
        break;
      case 3:
        if (!formData.region.trim()) {
          setError('Region is required');
          return false;
        }
        if (!formData.city.trim()) {
          setError('City is required');
          return false;
        }
        break;
      case 5:
        if (!formData.owner_email.trim() || !formData.owner_email.includes('@')) {
          setError('Valid email is required');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleSaveAsDraft = async () => {
    if (!validateCurrentStep()) return;
    
    setIsSubmitting(true);
    setError('');
    const supabase = createClient();
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Create property with draft status
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert({
          ...formData,
          user_id: user.id,
          status: 'draft',
          listed_by_type: 'owner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (propertyError) throw propertyError;
      
      // Handle image uploads if any
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const fileName = `${property.id}/${Date.now()}-${file.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('property-media')
            .upload(fileName, file);
            
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('property-media')
            .getPublicUrl(fileName);
            
          await supabase.from('property_media').insert({
            property_id: property.id,
            media_url: publicUrl,
            media_type: 'image',
            is_primary: i === 0,
            display_order: i
          });
        }
      }
      
      // Success - redirect to dashboard with draft message
      router.push('/dashboard/owner?success=Property saved as draft');
      
    } catch (error: any) {
      console.error('Save draft error:', error);
      setError(`Failed to save draft: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!validateCurrentStep()) return;
    
    setIsSubmitting(true);
    setError('');
    const supabase = createClient();
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Create property with pending status
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert({
          ...formData,
          user_id: user.id,
          status: 'pending',
          listed_by_type: 'owner',
          listing_type: 'sale',
          price: Number(formData.price),
          bedrooms: Number(formData.bedrooms),
          bathrooms: Number(formData.bathrooms),
          house_size_value: formData.house_size_value ? Number(formData.house_size_value) : null,
          land_size_value: formData.land_size_value ? Number(formData.land_size_value) : null,
          year_built: formData.year_built ? Number(formData.year_built) : null
        })
        .select()
        .single();
      
      if (propertyError) throw propertyError;
      
      // Upload images if any
      if (images.length > 0 && property) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const fileName = `${property.id}/${Date.now()}-${file.name}`;
          
          try {
            // Upload to storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('property-images')
              .upload(fileName, file);
            
            if (!uploadError && uploadData) {
              // Save to property_media
              await supabase
                .from('property_media')
                .insert({
                  property_id: property.id,
                  media_url: uploadData.path,
                  is_primary: i === 0,
                  position: i
                });
            }
          } catch (uploadErr) {
            console.warn(`Failed to upload image ${i + 1}:`, uploadErr);
          }
        }
      }
      
      // Success - redirect to dashboard
      router.push('/dashboard/owner?success=Property submitted for review');
      
    } catch (error: any) {
      console.error('Submission error:', error);
      setError(`Failed to submit property: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ['Basic Info', 'Details', 'Location', 'Photos', 'Contact', 'Review'];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Create Your FSBO Listing</h1>
      
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`text-sm ${
                currentStep > idx + 1 
                  ? 'text-green-600 font-medium' 
                  : currentStep === idx + 1 
                    ? 'text-blue-600 font-bold' 
                    : 'text-gray-400'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Form steps */}
      <div className="min-h-[400px]">
        {currentStep === 1 && <Step1BasicInfo formData={formData} setFormData={setFormData} />}
        {currentStep === 2 && <Step2Details formData={formData} setFormData={setFormData} />}
        {currentStep === 3 && <Step3Location formData={formData} setFormData={setFormData} />}
        {currentStep === 4 && <Step4Photos images={images} setImages={setImages} />}
        {currentStep === 5 && <Step5Contact formData={formData} setFormData={setFormData} />}
        {currentStep === 6 && <Step6Review formData={formData} images={images} />}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t">
        {currentStep > 1 ? (
          <button
            onClick={handlePrevious}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Previous
          </button>
        ) : (
          <div></div>
        )}
        
        {currentStep < 6 ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={isSubmitting}
          >
            Next
          </button>
        ) : (
          <div className="flex gap-4 mt-8 p-6 border-t">
            <button 
              onClick={handleSaveAsDraft}
              className="px-6 py-2 border border-gray-300 rounded"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save as Draft'}
            </button>
            <button 
              onClick={handleSubmitForReview}
              className="px-6 py-3 bg-orange-600 text-white rounded hover:bg-orange-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}