'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/supabase';
import CompletionIncentive, { CompletionProgress } from "@/components/CompletionIncentive";
import { calculateCompletionScore, getUserMotivation } from "@/lib/completionUtils";
import PropertySuccessScreen from "@/components/PropertySuccessScreen";
import { saveDraft } from '@/lib/draftManager';

// Step components
import Step1BasicInfo from './components/Step1BasicInfo';
import Step2Details from './components/Step2Details';
import Step3Location from './components/Step3Location';
import Step4Photos from './components/Step4Photos';
import Step5Contact from './components/Step5Contact';
import Step6Review from './components/Step6Review';
// import DebugSupabase from './debug-supabase';

// Main page wrapper with Suspense for useSearchParams
export default function CreateAgentProperty() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property form...</p>
        </div>
      </div>
    }>
      <CreateAgentPropertyContent />
    </Suspense>
  );
}

function CreateAgentPropertyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Admin-on-behalf-of creation: Read target user from URL params
  const targetUserId = searchParams.get('for_user');
  const targetUserName = searchParams.get('user_name');
  const isCreatingForUser = !!targetUserId;

  // Draft loading from URL (?draft=<id>)
  const draftIdFromUrl = searchParams.get('draft');

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false); // Bulletproof double-submit prevention
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Draft tracking state
  const [draftId, setDraftId] = useState<string | null>(draftIdFromUrl);
  const [loadingDraft, setLoadingDraft] = useState(!!draftIdFromUrl);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showDraftToast, setShowDraftToast] = useState(false);
  const formDataRef = useRef<any>(null); // For beforeunload access
  const draftIdRef = useRef<string | null>(draftIdFromUrl);
  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    description: '',
    price: '',
    property_type: '',

    // NEW: Property Category (residential or commercial)
    property_category: 'residential' as 'residential' | 'commercial',

    // Property Details
    bedrooms: '',
    bathrooms: '',
    house_size_value: '',
    house_size_unit: 'sq ft',
    land_size_value: '',
    land_size_unit: 'sq ft',
    year_built: '',
    amenities: [] as string[],

    // Lot Dimensions
    lot_length: '',
    lot_width: '',
    lot_dimension_unit: 'ft',

    // Location
    region: '',
    city: '',
    neighborhood: '',
    address: '',
    show_address: false,
    country: 'GY',
    currency: 'GYD',

    // Contact (Agent's contact info - for buyer inquiries)
    owner_email: '',
    owner_whatsapp: '',

    // Owner Info (Property owner's contact - for duplicate protection)
    property_owner_whatsapp: '',
    property_owner_email: '',
    listing_protection: true,

    // Listing fields
    listing_type: 'sale',
    status: 'pending',

    // NEW: Commercial fields
    commercial_type: '',
    floor_size_sqft: '',
    building_floor: '',
    number_of_floors: '',
    parking_spaces: '',
    loading_dock: false,
    elevator_access: false,
    climate_controlled: false,
    commercial_garage_entrance: false,
    zoning_type: '',

    // NEW: Lease fields (for commercial)
    lease_term_years: '',
    lease_type: '',
    financing_available: false,
    financing_details: '',
  });
  
  const [images, setImages] = useState<File[]>([]);

  // State for target user profile (for admin-on-behalf-of creation)
  const [targetUserProfile, setTargetUserProfile] = useState<{
    email: string;
    phone: string;
  } | null>(null);

  // Fetch target user profile when creating for another user
  useEffect(() => {
    const fetchTargetUserProfile = async () => {
      if (!targetUserId) return;

      try {
        const supabase = createClient();
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('email, phone')
          .eq('id', targetUserId)
          .single();

        if (error) {
          console.error('Error fetching target user profile:', error);
          return;
        }

        if (profile) {
          setTargetUserProfile({
            email: profile.email || '',
            phone: profile.phone || ''
          });
          console.log('Fetched target user profile:', profile.email);
        }
      } catch (err) {
        console.error('Failed to fetch target user profile:', err);
      }
    };

    fetchTargetUserProfile();
  }, [targetUserId]);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Keep refs in sync for beforeunload handler
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  useEffect(() => {
    draftIdRef.current = draftId;
  }, [draftId]);

  // Load draft from URL parameter (?draft=<id>)
  useEffect(() => {
    if (!draftIdFromUrl) return;

    const loadExistingDraft = async () => {
      try {
        const res = await fetch(`/api/properties/drafts/${draftIdFromUrl}`);
        const data = await res.json();

        if (data.success && data.draft) {
          const d = data.draft;
          setFormData(prev => ({
            ...prev,
            title: d.title || '',
            description: d.description || '',
            price: d.price?.toString() || '',
            property_type: d.property_type || '',
            property_category: d.property_category || 'residential',
            bedrooms: d.bedrooms?.toString() || '',
            bathrooms: d.bathrooms?.toString() || '',
            house_size_value: d.house_size_value?.toString() || '',
            house_size_unit: d.house_size_unit || 'sq ft',
            land_size_value: d.land_size_value?.toString() || '',
            land_size_unit: d.land_size_unit || 'sq ft',
            year_built: d.year_built?.toString() || '',
            amenities: d.amenities || [],
            lot_length: d.lot_length?.toString() || '',
            lot_width: d.lot_width?.toString() || '',
            lot_dimension_unit: d.lot_dimension_unit || 'ft',
            region: d.region || '',
            city: d.city || '',
            neighborhood: d.neighborhood || '',
            address: d.address || '',
            show_address: d.show_address || false,
            country: d.country || 'GY',
            currency: d.currency || 'GYD',
            owner_email: d.owner_email || '',
            owner_whatsapp: d.owner_whatsapp || '',
            property_owner_whatsapp: d.property_owner_whatsapp || '',
            property_owner_email: d.property_owner_email || '',
            listing_protection: d.listing_protection ?? true,
            listing_type: d.listing_type || 'sale',
            commercial_type: d.commercial_type || '',
            floor_size_sqft: d.floor_size_sqft?.toString() || '',
            building_floor: d.building_floor || '',
            number_of_floors: d.number_of_floors?.toString() || '',
            parking_spaces: d.parking_spaces?.toString() || '',
            loading_dock: d.loading_dock || false,
            elevator_access: d.elevator_access || false,
            climate_controlled: d.climate_controlled || false,
            commercial_garage_entrance: d.commercial_garage_entrance || false,
            zoning_type: d.zoning_type || '',
            lease_term_years: d.lease_term_years || '',
            lease_type: d.lease_type || '',
            financing_available: d.financing_available || false,
            financing_details: d.financing_details || '',
          }));
          setDraftId(draftIdFromUrl);
        }
      } catch (err) {
        console.error('Error loading draft:', err);
      } finally {
        setLoadingDraft(false);
      }
    };

    loadExistingDraft();
  }, [draftIdFromUrl]);

  // Save draft quietly on navigation (fire-and-forget, no blocking)
  const saveDraftQuietly = useCallback(async (currentFormData: typeof formData) => {
    // Don't save if submitting, already saving, or no meaningful data
    if (isSavingDraft || isSubmitting || submittingRef.current) return;
    if (!currentFormData.price && !currentFormData.title && !currentFormData.description) return;

    setIsSavingDraft(true);
    try {
      const result = await saveDraft(
        { ...currentFormData, listing_type: currentFormData.listing_type || 'sale' },
        draftId || undefined
      );

      if (result.success && result.draftId) {
        setDraftId(result.draftId);
        draftIdRef.current = result.draftId;
        setShowDraftToast(true);
        setTimeout(() => setShowDraftToast(false), 2000);
      }
    } catch (err) {
      console.error('Background draft save failed:', err);
    } finally {
      setIsSavingDraft(false);
    }
  }, [draftId, isSavingDraft, isSubmitting]);

  // Save draft on page unload (best-effort via sendBeacon)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const fd = formDataRef.current;
      if (!fd || (!fd.title && !fd.price && !fd.description)) return;

      const draftTitle = fd.title || `${fd.property_type || 'Property'} - ${new Date().toLocaleDateString()}`;
      const payload = JSON.stringify({
        draft_id: draftIdRef.current,
        title: draftTitle,
        draft_type: fd.listing_type || 'sale',
        ...fd,
      });

      navigator.sendBeacon(
        '/api/properties/drafts',
        new Blob([payload], { type: 'application/json' })
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Calculate completion score in real-time
  const completionAnalysis = calculateCompletionScore({
    title: formData.title,
    description: formData.description,
    price: formData.price.toString(),
    property_type: formData.property_type,
    house_size_value: formData.house_size_value.toString(),
    region: formData.region,
    city: formData.city,
    images: images,
    amenities: formData.amenities || []
  });

  const userMotivation = getUserMotivation('agent');

  const validateCurrentStep = () => {
    setError('');
    
    switch (currentStep) {
      case 1:
        if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
          setError('Valid price is required');
          return false;
        }
        if (!formData.property_type) {
          setError('Property type is required');
          return false;
        }
        break;
      case 2:
        // Check if this is a land property (land doesn't have bedrooms/bathrooms)
        const isLandProperty = formData.property_type?.toLowerCase().includes('land') ||
                               formData.property_type?.toLowerCase().includes('farmland');
        const isCommercial = formData.property_category === 'commercial';

        // Only require beds/baths for residential non-land properties
        if (!isLandProperty && !isCommercial) {
          if (!formData.bedrooms || isNaN(Number(formData.bedrooms))) {
            setError('Number of bedrooms is required');
            return false;
          }
          if (!formData.bathrooms || isNaN(Number(formData.bathrooms))) {
            setError('Number of bathrooms is required');
            return false;
          }
        }

        // Require commercial_type for commercial properties
        if (isCommercial && !formData.commercial_type) {
          setError('Commercial type is required');
          return false;
        }
        if (!formData.description.trim()) {
          setError('Property description is required');
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
        if (!formData.neighborhood || !formData.neighborhood.trim() || formData.neighborhood.trim().length < 2) {
          setError('Neighborhood/Area is required (minimum 2 characters)');
          return false;
        }
        if (!formData.address || !formData.address.trim()) {
          setError('Property address is required for verification');
          return false;
        }
        if (!formData.title || !formData.title.trim()) {
          setError('Property title is required');
          return false;
        }
        break;
      case 5:
        if (!formData.owner_email.trim() || !formData.owner_email.includes('@')) {
          setError('Valid email is required');
          return false;
        }
        if (!formData.owner_whatsapp.trim()) {
          setError('WhatsApp number is required for customer contact');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      saveDraftQuietly(formData); // fire-and-forget save on navigation
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setError('');
    saveDraftQuietly(formData); // fire-and-forget save on navigation
    setCurrentStep(currentStep - 1);
  };

  const handleSaveAsDraft = async () => {
    if (!validateCurrentStep()) return;
    
    setIsSubmitting(true);
    setError('');
    
    console.log('🎯 Starting save draft process...');
    
    try {
      // Initialize Supabase client
      const supabase = createClient();
      const draftData: any = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        property_type: formData.property_type || 'Single Family Home',
        bedrooms: Number(formData.bedrooms) || 0,
        bathrooms: Number(formData.bathrooms) || 0,
        house_size_value: Number(formData.house_size_value) || 1000,
        house_size_unit: formData.house_size_unit || 'sq ft',
        land_size_value: formData.land_size_value ? Number(formData.land_size_value) : null,
        land_size_unit: formData.land_size_unit || 'sq ft',
        year_built: formData.year_built ? Number(formData.year_built) : null,
        amenities: formData.amenities || [],
        lot_length: formData.lot_length ? Number(formData.lot_length) : null,
        lot_width: formData.lot_width ? Number(formData.lot_width) : null,
        lot_dimension_unit: formData.lot_dimension_unit || 'ft',
        region: formData.region || '',
        city: formData.city || '',
        neighborhood: formData.neighborhood || '',
        address: formData.address || '',
        show_address: formData.show_address || false,
        owner_email: formData.owner_email,
        owner_whatsapp: formData.owner_whatsapp || '',
        property_owner_whatsapp: formData.property_owner_whatsapp || '',
        property_owner_email: formData.property_owner_email || '',
        listing_protection: formData.listing_protection ?? true,
        listing_type: 'sale',
        images: [] // Initialize empty, will upload images separately
      };
      
      // Upload images first if any exist
      const uploadedImageUrls: string[] = [];
      if (images.length > 0) {
        console.log('📸 Uploading images to storage...');
        
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          try {
            console.log(`📤 Uploading image ${i + 1}/${images.length}: ${file.name}`);
            
            // Create unique filename
            const timestamp = Date.now();
            const extension = file.name.split('.').pop() || 'jpg';
            const fileName = `agent/${timestamp}-${i}.${extension}`;
            
            // Upload to Supabase storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('property-images')
              .upload(fileName, file);
            
            if (uploadError) {
              console.error(`❌ Image upload error for ${fileName}:`, uploadError);
              throw uploadError;
            }
            
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('property-images')
              .getPublicUrl(fileName);
              
            if (urlData?.publicUrl) {
              uploadedImageUrls.push(urlData.publicUrl);
              console.log(`✅ Uploaded image ${i + 1}:`, urlData.publicUrl);
            } else {
              console.error(`❌ Failed to get public URL for ${fileName}`);
            }
          } catch (uploadErr: any) {
            console.error(`❌ Failed to upload image ${i + 1}:`, uploadErr);
            setError(`Failed to upload image "${file.name}": ${uploadErr.message}`);
            return; // Stop the process if image upload fails
          }
        }
        
        // Add uploaded URLs to draft data
        draftData.images = uploadedImageUrls.map((url, index) => ({
          url: url,
          isPrimary: index === 0,
          altText: `Property image ${index + 1}`
        }));
        
        console.log(`✅ All ${images.length} images uploaded successfully`);
      }
      
      console.log('🚀 Sending draft to API...', { 
        hasImages: draftData.images.length > 0,
        title: draftData.title,
        email: formData.owner_email 
      });
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error('❌ API request timed out after 30 seconds');
      }, 30000); // 30 second timeout
      
      // Use new draft API — include draftId if we're updating an existing draft
      const response = await fetch('/api/properties/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(draftId ? { draft_id: draftId } : {}),
          draft_type: 'sale',
          site_id: 'guyana', // Default for agent created properties - could be made dynamic later
          ...draftData
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API returned error status:', response.status, errorText);
        throw new Error(`Server error (${response.status}): ${errorText || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('📊 API Response:', result);
      
      if (!result.success) {
        console.error('❌ API returned failure:', result.error);
        throw new Error(result.error || 'Failed to save draft');
      }
      
      console.log('✅ Draft saved successfully:', result.draft_id);
      
      // Success - redirect to dashboard with draft message
      router.push('/dashboard/agent?success=Property saved as draft');
      
    } catch (error: any) {
      console.error('💥 Save draft error:', error);
      
      // Provide specific error messages for common issues
      if (error.name === 'AbortError') {
        setError('Request timed out. Please check your internet connection and try again.');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        setError('Session expired. Please refresh the page and log in again.');
      } else {
        setError(`Failed to save draft: ${error.message || 'Unknown error occurred'}`);
      }
      
      // Also log to help debugging
      console.error('📝 Form data at time of error:', formData);
      console.error('📸 Images at time of error:', images.length);
    } finally {
      setIsSubmitting(false);
      console.log('🏁 Save draft process completed');
    }
  };

  const handleSubmitForReview = async () => {
    if (!validateCurrentStep()) return;
    
    // BULLETPROOF double-submit prevention using ref (immediate check)
    if (submittingRef.current || isSubmitting) {
      console.log('🚫 Submission already in progress - blocking duplicate');
      return;
    }
    
    // Set BOTH ref and state immediately
    submittingRef.current = true;
    setIsSubmitting(true);
    setError('');
    const supabase = createClient();
    
    try {
      // Get current user with detailed error handling
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        setError('Please login to submit a property');
        submittingRef.current = false; // Reset ref on error
        setIsSubmitting(false);
        return;
      }
      
      console.log('Submitting as user:', user.id);
      console.log('Form data:', formData);
      
      // Prepare data for API submission
      const isCommercialProperty = formData.property_category === 'commercial';
      const isLandProperty = formData.property_type?.toLowerCase().includes('land') ||
                             formData.property_type?.toLowerCase().includes('farmland');

      const propertyData = {
        title: formData.title || 'Untitled Property',
        description: formData.description || '',
        price: formData.price || '0',
        property_type: formData.property_type || 'Single Family Home',
        listing_type: formData.listing_type || 'sale',

        // Property category (residential or commercial)
        property_category: formData.property_category || 'residential',

        // Numeric fields - only include beds/baths for residential non-land
        bedrooms: (!isCommercialProperty && !isLandProperty) ? (formData.bedrooms || '0') : '0',
        bathrooms: (!isCommercialProperty && !isLandProperty) ? (formData.bathrooms || '0') : '0',
        house_size_value: formData.house_size_value || null,
        house_size_unit: formData.house_size_unit || 'sq ft',
        land_size_value: formData.land_size_value || null,
        land_size_unit: formData.land_size_unit || 'sq ft',
        year_built: formData.year_built || null,

        // Lot dimensions
        lot_length: formData.lot_length || null,
        lot_width: formData.lot_width || null,
        lot_dimension_unit: formData.lot_dimension_unit || 'ft',

        // Location
        region: formData.region || '',
        city: formData.city || '',
        neighborhood: formData.neighborhood || '',
        address: formData.address || '',
        show_address: formData.show_address || false,
        country: formData.country || 'GY',

        // Contact info (Agent's contact)
        owner_email: formData.owner_email || '',
        owner_whatsapp: formData.owner_whatsapp || '',

        // Owner info (for duplicate protection)
        property_owner_whatsapp: formData.property_owner_whatsapp || '',
        property_owner_email: formData.property_owner_email || '',
        listing_protection: formData.listing_protection ?? true,

        // Amenities
        amenities: formData.amenities || [],

        // Commercial fields
        commercial_type: isCommercialProperty ? (formData.commercial_type || null) : null,
        floor_size_sqft: formData.floor_size_sqft ? parseInt(formData.floor_size_sqft) : null,
        building_floor: formData.building_floor || null,
        number_of_floors: formData.number_of_floors ? parseInt(formData.number_of_floors) : null,
        parking_spaces: formData.parking_spaces ? parseInt(formData.parking_spaces) : null,
        loading_dock: formData.loading_dock || false,
        elevator_access: formData.elevator_access || false,
        climate_controlled: formData.climate_controlled || false,
        commercial_garage_entrance: formData.commercial_garage_entrance || false,
        zoning_type: formData.zoning_type || null,

        // Lease fields (for commercial)
        lease_term_years: formData.lease_term_years || null,
        lease_type: formData.lease_type || null,
        financing_available: formData.financing_available || false,
        financing_details: formData.financing_details || null,

        // Status
        status: 'pending',

        // Admin-on-behalf-of creation: Include target user ID if admin is creating for another user
        ...(targetUserId && { target_user_id: targetUserId })
      };

      // Upload images directly to Supabase Storage (bypasses API payload limits)
      // This is the correct approach - images go directly to storage, only URLs go to API
      let imageUrls: string[] = [];
      if (images.length > 0) {
        console.log('📤 Uploading images directly to Supabase Storage...');
        try {
          const { uploadImagesToSupabase } = await import('@/lib/supabaseImageUpload');
          const uploadedImages = await uploadImagesToSupabase(images, user.id);
          imageUrls = uploadedImages.map(img => img.url);
          console.log(`✅ ${imageUrls.length} images uploaded successfully`);
        } catch (err) {
          console.error('Failed to upload images to storage:', err);
          setError('Failed to upload images. Please try again.');
          submittingRef.current = false;
          setIsSubmitting(false);
          return;
        }
      }

      // Add image URLs to property data (small strings, not base64 data)
      const propertyDataWithImages = {
        ...propertyData,
        imageUrls: imageUrls // API expects imageUrls array, not base64 images
      };

      console.log('Submitting to API...');

      // Submit to API instead of direct Supabase
      // Payload is now small - just URLs, no base64 image data
      const response = await fetch('/api/properties/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyDataWithImages)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('API submission failed:', result);

        // Provide more specific error message based on the error type
        let errorMessage = result.error || 'Submission failed. Please try again.';

        // Check if it was an image linking failure
        if (result.details?.hint) {
          errorMessage = `${result.error} ${result.details.hint}`;
        }

        setError(errorMessage);
        submittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      // Log success with image status details
      console.log('Success! Property created via API:', result);
      if (result.imageStatus) {
        console.log(`📸 Image status: ${result.imageStatus.linked}/${result.imageStatus.uploaded} images linked`);
        if (!result.imageStatus.allImagesLinked) {
          console.warn('⚠️ Warning: Not all images were linked to the property');
        }
      }

      // Success - show success screen (PropertySuccessScreen will handle redirect)
      console.log('Property submission complete, showing success screen...');
      setSuccess(true);
      setIsSubmitting(false);
      submittingRef.current = false;
      
    } catch (err: any) {
      console.error('Unexpected error during submission:', err);
      console.error('Error details:', {
        message: err?.message,
        name: err?.name,
        stack: err?.stack
      });

      // Provide more specific error messages
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (err?.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err?.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again with smaller images.';
      } else if (err?.message?.includes('Unauthorized') || err?.message?.includes('401')) {
        errorMessage = 'Session expired. Please refresh the page and log in again.';
      } else if (err?.message) {
        errorMessage = `Error: ${err.message}`;
      }

      setError(errorMessage);
      submittingRef.current = false; // Reset ref on error
      setIsSubmitting(false);
    }
  };

  const steps = ['Basic Info', 'Details', 'Location', 'Photos', 'Contact', 'Review'];

  // Show loading state while draft is being loaded from URL
  if (loadingDraft) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your draft...</p>
        </div>
      </div>
    );
  }

  // Show success screen when property is submitted
  if (success) {
    // Redirect admin to admin dashboard if they created property for another user
    const redirectPath = isCreatingForUser ? '/admin-dashboard' : '/dashboard/agent';

    return (
      <PropertySuccessScreen
        redirectPath={redirectPath}
        redirectDelay={3000}
        userType="agent"
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-3">
          🏘️ Create Property Listing
          <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">Agent Property</span>
        </h1>
        <p className="text-gray-600 mb-8">Add a new property to your agent portfolio</p>

        {/* Admin-on-behalf-of creation banner */}
        {isCreatingForUser && targetUserName && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-full p-2">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-purple-900">Creating Property on Behalf of User</p>
                <p className="text-purple-700">
                  This property will be assigned to: <strong>{decodeURIComponent(targetUserName)}</strong>
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  The property will count against their account limits and appear in their dashboard.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Draft resume banner */}
        {draftId && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 rounded-full p-2">
                <span className="text-lg">📝</span>
              </div>
              <div>
                <p className="font-semibold text-amber-900">Resuming Draft</p>
                <p className="text-amber-700 text-sm">
                  Your progress is saved automatically when you navigate between steps.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Performance Score at Top */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200 mb-8">
          <CompletionProgress 
            completionPercentage={completionAnalysis.percentage}
            userType="agent"
            missingFields={completionAnalysis.missingFields}
          />
        </div>
        
        {/* Enhanced Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center text-center ${
                  currentStep > idx + 1 
                    ? 'text-green-600' 
                    : currentStep === idx + 1 
                      ? 'text-blue-600' 
                      : 'text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${
                  currentStep > idx + 1 
                    ? 'bg-green-100 text-green-600' 
                    : currentStep === idx + 1 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-400'
                }`}>
                  {currentStep > idx + 1 ? '✓' : idx + 1}
                </div>
                <div className={`text-xs font-medium ${
                  currentStep > idx + 1 
                    ? 'text-green-600' 
                    : currentStep === idx + 1 
                      ? 'text-blue-600' 
                      : 'text-gray-400'
                }`}>
                  {step}
                </div>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>
          <div className="text-center mt-2 text-sm text-gray-600">
            Step {currentStep} of {steps.length}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-6 bg-red-50 border-2 border-red-200 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-red-500 text-2xl">⚠️</span>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Form steps - Enhanced styling */}
        <div className="min-h-[500px] bg-gray-50 p-8 rounded-xl border border-gray-200">
          {currentStep === 1 && <Step1BasicInfo formData={formData} setFormData={setFormData} />}
          {currentStep === 2 && <Step2Details formData={formData} setFormData={setFormData} />}
          {currentStep === 3 && <Step3Location formData={formData} setFormData={setFormData} />}
          {currentStep === 4 && <Step4Photos images={images} setImages={setImages} />}
          {currentStep === 5 && (
            <Step5Contact
              formData={formData}
              setFormData={setFormData}
              targetUserProfile={targetUserProfile}
              isCreatingForUser={isCreatingForUser}
            />
          )}
          {currentStep === 6 && <Step6Review formData={formData} images={images} />}
        </div>

        {/* Enhanced Navigation buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          {currentStep > 1 ? (
            <button
              onClick={handlePrevious}
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium disabled:opacity-50"
              disabled={isSubmitting}
            >
              ← Previous
            </button>
          ) : (
            <div></div>
          )}
          
          {currentStep < 6 ? (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg transform hover:scale-105 disabled:opacity-50"
              disabled={isSubmitting}
            >
              Next →
            </button>
          ) : (
            <div className="flex gap-4">
              <button 
                onClick={handleSaveAsDraft}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    💾 Save as Draft
                  </span>
                )}
              </button>
              <button 
                type="button"
                onClick={handleSubmitForReview}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-bold shadow-lg transform hover:scale-105 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    🚀 Submit for Review
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Draft saved toast */}
        {showDraftToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in text-sm font-medium">
            <span>✓</span> Draft saved
          </div>
        )}
      </div>
    </div>
  );
}