
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// Authentication is now handled entirely server-side in the API route
import GlobalSouthLocationSelector from "@/components/GlobalSouthLocationSelector";
import EnhancedImageUpload from "@/components/EnhancedImageUpload";
import AmenitiesSelector from "@/components/AmenitiesSelector";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import CompletionIncentive, { CompletionProgress } from "@/components/CompletionIncentive";
import { calculateCompletionScore, getUserMotivation } from "@/lib/completionUtils";
import AIDescriptionAssistant from "@/components/AIDescriptionAssistant";
import LotDimensions from "@/components/LotDimensions";
import { DimensionUnit } from "@/lib/lotCalculations";
// Duplicate Prevention System
import { usePropertySubmission } from "@/hooks/usePropertySubmission";
import DuplicateWarningDialog from "@/components/DuplicateWarningDialog";
import PropertySuccessScreen from "@/components/PropertySuccessScreen";
// Video Upload Access Control
import { canUploadVideo, getVideoUpgradeMessage, getUserProfile } from "@/lib/subscription-utils";
// Auto-save and Draft Management
import { useAutoSave } from "@/hooks/useAutoSave";
import { saveDraft, loadUserDrafts, loadDraft, deleteDraft } from "@/lib/draftManager";
import { isAutoSaveEligible, getAutoSaveSettings } from "@/lib/autoSaveEligibility";


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
  video_url: string; // YouTube/Vimeo video URL for premium tiers
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

export default function CreatePropertyPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    location: "",
    title: "",
    description: "",
    price: "",
    status: "draft",
    property_type: "House", // Default to House to prevent validation errors
    listing_type: "sale", // Default to sale to prevent validation errors
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
    video_url: "",
    // Commercial Property Fields
    property_category: "residential", // Default to residential
    commercial_type: "",
    floor_size_sqft: "",
    building_floor: "",
    number_of_floors: "",
    parking_spaces: "",
    loading_dock: false,
    elevator_access: false,
    commercial_garage_entrance: false,
    climate_controlled: false,
    // Commercial lease/finance fields
    lease_term_years: "",
    lease_type: "",
    financing_available: false,
    financing_details: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("GY");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [currencyCode, setCurrencyCode] = useState<string>("GYD");
  const [currencySymbol, setCurrencySymbol] = useState<string>("GY$");
  
  // Video upload access control
  const [canUserUploadVideo, setCanUserUploadVideo] = useState(false);
  const [videoUpgradeMessage, setVideoUpgradeMessage] = useState("");
  
  // Auto-save and Draft Management
  const [userProfile, setUserProfile] = useState<any>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [availableDrafts, setAvailableDrafts] = useState<any[]>([]);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // Comprehensive submission system with duplicate prevention
  const propertySubmission = usePropertySubmission({
    onSuccess: () => {
      setSuccess("✅ Property created successfully!");
      setLoading(false);
    },
    onError: (error) => {
      setError(error);
      setLoading(false);
    },
  });

  // Get user profile and set up auto-save eligibility
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { createClient } = await import('@/supabase');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.id) {
          // Get user profile data
          const { data: profile } = await supabase
            .from('profiles')
            .select('phone, user_type, email')
            .eq('id', user.id)
            .single();
            
          if (profile) {
            // Set user profile and check auto-save eligibility
            const profileData = {
              email: user.email || profile.email,
              user_type: profile.user_type,
              phone: profile.phone
            };
            
            setUserProfile(profileData);
            
            // TEMPORARILY DISABLE AUTOSAVE TO PREVENT DUPLICATES
            // Check if user is eligible for auto-save
            const eligible = false; // isAutoSaveEligible(profileData);
            setAutoSaveEnabled(eligible);
            
            console.log('User profile loaded:', {
              email: profileData.email,
              user_type: profileData.user_type,
              autoSaveEligible: eligible
            });
            
            // Auto-populate WhatsApp if not already set
            if (profile.phone && !form.owner_whatsapp) {
              setForm(prev => ({ ...prev, owner_whatsapp: profile.phone }));
            }
          }
        }
      } catch (error) {
        console.warn('Could not load user profile:', error);
      }
    };
    
    loadUserProfile();
  }, []);

  // Check video upload permissions
  useEffect(() => {
    const checkVideoAccess = async () => {
      try {
        const { createClient } = await import('@/supabase');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const userProfile = await getUserProfile(user);
          if (userProfile) {
            const hasVideoAccess = canUploadVideo(userProfile);
            setCanUserUploadVideo(hasVideoAccess);
            setVideoUpgradeMessage(getVideoUpgradeMessage(userProfile));
            console.log('Portal Hub - Video access:', hasVideoAccess, 'for user:', userProfile.email);
          }
        }
      } catch (error) {
        console.warn('Could not check video access:', error);
        setCanUserUploadVideo(false);
      }
    };
    
    checkVideoAccess();
  }, []);

  // Load drafts when auto-save becomes enabled
  useEffect(() => {
    const loadDrafts = async () => {
      if (!autoSaveEnabled) return;
      
      try {
        const drafts = await loadUserDrafts();
        setAvailableDrafts(drafts);
        
        // Show draft dialog if there are available drafts and no current form data
        if (drafts.length > 0 && !form.title && !form.description) {
          setShowDraftDialog(true);
        }
      } catch (error) {
        console.warn('Could not load drafts:', error);
      }
    };
    
    loadDrafts();
  }, [autoSaveEnabled]);

  // Auto-save hook integration with eligibility-based settings
  const autoSaveSettings = userProfile ? getAutoSaveSettings(userProfile) : { enabled: false, interval: 0, minFieldsRequired: 0 };
  
  const autoSave = useAutoSave({
    data: { 
      ...form, 
      images,
      currency: currencyCode,
      currency_symbol: currencySymbol,
      country: selectedCountry
    },
    onSave: async (data, isDraft) => {
      return await saveDraft(data);
    },
    interval: autoSaveSettings.interval,
    enabled: autoSaveSettings.enabled && !loading && !success,
    minFieldsRequired: autoSaveSettings.minFieldsRequired,
    onSaveStart: () => setAutoSaveStatus('saving'),
    onSaveComplete: (success, draftId) => {
      if (success) {
        setAutoSaveStatus('saved');
        setLastSavedTime(new Date());
        if (draftId && !currentDraftId) {
          setCurrentDraftId(draftId);
        }
      } else {
        setAutoSaveStatus('error');
      }
    }
  });

  // Calculate completion score in real-time
  const completionAnalysis = calculateCompletionScore({
    ...form,
    images,
    amenities: Array.isArray(form.amenities) ? form.amenities : []
  });

  const userMotivation = getUserMotivation('agent');

  // Auto-save UI visibility check
  const shouldEnableAutoSave = autoSaveEnabled && userProfile;

  // Draft management functions
  const handleLoadDraft = async (draftId: string) => {
    try {
      setLoading(true);
      const draftData = await loadDraft(draftId);
      
      if (draftData) {
        // Populate form with draft data
        setForm({
          location: draftData.location || "",
          title: draftData.title || "",
          description: draftData.description || "",
          price: draftData.price?.toString() || "",
          status: "draft",
          property_type: draftData.property_type || "House",
          listing_type: draftData.listing_type || "sale",
          bedrooms: draftData.bedrooms?.toString() || "",
          bathrooms: draftData.bathrooms?.toString() || "",
          house_size_value: draftData.house_size_value?.toString() || "",
          house_size_unit: draftData.house_size_unit || "sq ft",
          land_size_value: draftData.land_size_value?.toString() || "",
          land_size_unit: draftData.land_size_unit || "sq ft",
          year_built: draftData.year_built?.toString() || "",
          amenities: draftData.amenities || [],
          region: draftData.region || "",
          city: draftData.city || "",
          neighborhood: draftData.neighborhood || "",
          lot_length: draftData.lot_length?.toString() || "",
          lot_width: draftData.lot_width?.toString() || "",
          lot_dimension_unit: draftData.lot_dimension_unit || "ft",
          owner_whatsapp: draftData.owner_whatsapp || "",
          video_url: draftData.video_url || "",
          // Commercial fields
          property_category: draftData.property_category || "residential",
          commercial_type: draftData.commercial_type || "",
          floor_size_sqft: draftData.floor_size_sqft?.toString() || "",
          building_floor: draftData.building_floor || "",
          number_of_floors: draftData.number_of_floors || "",
          parking_spaces: draftData.parking_spaces?.toString() || "",
          loading_dock: draftData.loading_dock || false,
          elevator_access: draftData.elevator_access || false,
          commercial_garage_entrance: draftData.commercial_garage_entrance || false,
          climate_controlled: draftData.climate_controlled || false,
          lease_term_years: draftData.lease_term_years || "",
          lease_type: draftData.lease_type || "",
          financing_available: draftData.financing_available || false,
          financing_details: draftData.financing_details || "",
        });
        
        // Set location/currency data
        if (draftData.country) {
          setSelectedCountry(draftData.country);
        } else if (draftData.location) {
          setSelectedCountry(draftData.location);
        }
        if (draftData.region) {
          setSelectedRegion(draftData.region);
        }
        
        // Restore currency settings
        if (draftData.currency) {
          setCurrencyCode(draftData.currency);
        }
        if (draftData.currency_symbol) {
          setCurrencySymbol(draftData.currency_symbol);
        }
        
        // Handle images if available
        if (draftData.images && Array.isArray(draftData.images)) {
          // Note: Can't set File objects from URLs, but we can show existing images
          console.log('Draft has images:', draftData.images.length);
        }
        
        setCurrentDraftId(draftId);
        setShowDraftDialog(false);
        setError("");
        
        console.log('✅ Draft loaded successfully:', draftId);
      }
    } catch (error) {
      console.error('❌ Error loading draft:', error);
      setError('Failed to load draft. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      const success = await deleteDraft(draftId);
      if (success) {
        setAvailableDrafts(prev => prev.filter(d => d.id !== draftId));
        if (currentDraftId === draftId) {
          setCurrentDraftId(null);
        }
      }
    } catch (error) {
      console.error('❌ Error deleting draft:', error);
    }
  };

  const handleManualSave = async () => {
    try {
      console.log('💾 Manual save triggered...');
      setAutoSaveStatus('saving');
      
      // Directly call saveDraft with current form data including currency and country
      const result = await saveDraft({ 
        ...form, 
        images,
        currency: currencyCode,
        currency_symbol: currencySymbol,
        country: selectedCountry
      }, currentDraftId);
      
      if (result.success) {
        setAutoSaveStatus('saved');
        setLastSavedTime(new Date());
        
        // Update current draft ID if this is a new draft
        if (result.draftId && !currentDraftId) {
          setCurrentDraftId(result.draftId);
        }
        
        // Show success feedback
        alert('✅ Draft saved successfully! You can continue editing or come back later.');
        console.log('✅ Manual save successful:', result.draftId);
      } else {
        setAutoSaveStatus('error');
        alert('❌ Failed to save draft: ' + (result.error || 'Unknown error'));
        console.error('❌ Manual save failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Manual save error:', error);
      setAutoSaveStatus('error');
      alert('❌ Error saving draft. Please try again.');
    }
  };

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

  const handleCreateAnother = () => {
    // Reset form to initial state (keep WhatsApp from profile)
    const currentWhatsapp = form.owner_whatsapp;
    setForm({
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
      owner_whatsapp: currentWhatsapp, // Keep WhatsApp for convenience
      video_url: "",
      // Reset commercial fields
      property_category: "residential",
      commercial_type: "",
      floor_size_sqft: "",
      building_floor: "",
      number_of_floors: "",
      parking_spaces: "",
      loading_dock: false,
      elevator_access: false,
      commercial_garage_entrance: false,
      climate_controlled: false,
      lease_term_years: "",
      lease_type: "",
      financing_available: false,
      financing_details: "",
    });
    setImages([]);
    setSuccess("");
    setError("");
    setSelectedCountry("GY");
    setSelectedRegion("");
    setCurrencyCode("GYD");
    setCurrencySymbol("GY$");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard/agent");
  };


  // Extract the actual submission logic that can be called by usePropertySubmission
  const performActualSubmission = async () => {
    setLoading(true);
    setError("");

    // Validate required fields
    if (!form.property_type) {
      throw new Error('Please select a Property Type.');
    }
    
    if (!form.listing_type) {
      throw new Error('Please select a Listing Type (For Sale or For Rent).');
    }

    // Commercial property specific validation
    if (form.property_category === 'commercial') {
      if (!form.commercial_type) {
        throw new Error('Please select a Commercial Type for commercial properties.');
      }
    }

    if (images.length < 1) {
      throw new Error("Please upload at least one image.");
    }

    try {
      // The API route will handle all authentication server-side with @supabase/ssr
      console.log('🔍 Starting property creation - authentication handled by API route');

      // Initialize Supabase client for image uploads
      const { createClient } = await import('@/supabase');
      const supabase = createClient();

      // Get current user for image uploads
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Upload images directly to Supabase Storage (bypasses API payload limits)
      console.log('📤 Uploading images directly to Supabase Storage...');
      const { uploadImagesToSupabase } = await import('@/lib/supabaseImageUpload');
      const uploadedImages = await uploadImagesToSupabase(images, user.id);
      
      // Extract URLs for API
      const imageUrls = uploadedImages.map(img => img.url);
      console.log(`✅ ${imageUrls.length} images uploaded successfully`);

      // Create property using API route with image URLs (not base64 data)
      const res = await fetch("/api/properties/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Map agent form fields to API expected format
          title: form.title,
          description: form.description,
          price: form.price,
          property_type: form.property_type,
          listing_type: form.listing_type,
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          house_size_value: form.house_size_value,
          house_size_unit: form.house_size_unit,
          land_size_value: form.land_size_value,
          land_size_unit: form.land_size_unit,
          location: form.location || selectedRegion, // Use region as location fallback
          year_built: form.year_built,
          amenities: form.amenities,
          region: form.region || selectedRegion,
          city: form.city,
          neighborhood: form.neighborhood,
          address: form.neighborhood || form.city, // Use neighborhood or city as address
          status: form.status,
          country: selectedCountry,
          currency: currencyCode,
          imageUrls: imageUrls, // Send URLs instead of base64 data
          lot_length: form.lot_length ? Number(form.lot_length) : null,
          lot_width: form.lot_width ? Number(form.lot_width) : null,
          lot_dimension_unit: form.lot_dimension_unit,
          owner_whatsapp: form.owner_whatsapp,
          video_url: form.video_url.trim() || null, // Only include video URL if user has access and provided one
          // Commercial fields
          property_category: form.property_category,
          commercial_type: form.commercial_type || null,
          floor_size_sqft: form.floor_size_sqft ? Number(form.floor_size_sqft) : null,
          building_floor: form.building_floor || null,
          number_of_floors: form.number_of_floors ? Number(form.number_of_floors) : null,
          parking_spaces: form.parking_spaces ? Number(form.parking_spaces) : null,
          loading_dock: form.loading_dock,
          elevator_access: form.elevator_access,
          commercial_garage_entrance: form.commercial_garage_entrance,
          climate_controlled: form.climate_controlled,
          lease_term_years: form.lease_term_years,
          lease_type: form.lease_type,
          financing_available: form.financing_available,
          financing_details: form.financing_details,
          // userId will be extracted server-side from authenticated session
          propertyCategory: form.listing_type === 'sale' ? 'sale' : 'rental', // Map to API format
          site_id: selectedCountry === 'JM' ? 'jamaica' : 'guyana',  // Dynamic site_id based on country
          // Draft conversion fields - link this submission to the draft
          draft_id: currentDraftId || undefined,
          _isPublishDraft: currentDraftId ? true : false, // Indicate this is converting a draft
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        // Check for authentication errors
        if (res.status === 401) {
          console.error('❌ Authentication failed - corrupted session detected');
          setError("Authentication error detected. Please log out and log back in to fix your session.");
        } else {
          setError(result.error || "Failed to create property. Please try again.");
        }
        setLoading(false);
        return;
      }

      console.log('✅ Property created successfully via API');
      
      // If this was from a draft, delete the draft now that it's published
      if (currentDraftId) {
        console.log('🗑️ Deleting draft after successful submission:', currentDraftId);
        const deleted = await deleteDraft(currentDraftId);
        if (deleted) {
          console.log('✅ Draft deleted successfully');
          setCurrentDraftId(null); // Clear the draft ID
        } else {
          console.warn('⚠️ Failed to delete draft, but property was created successfully');
        }
      }
      
      // Show success message - PropertySuccessScreen will handle the redirect
      setSuccess("✅ Property created successfully!");
      setError("");
      setLoading(false);
      
      // PropertySuccessScreen component handles redirect automatically
      // No manual redirect needed here
      
    } catch (authError: any) {
      console.error('❌ Property creation failed:', authError);
      const errorMessage = authError.message || "Failed to create property. Please try again.";
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage); // Re-throw so usePropertySubmission can handle it
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-3">
          🏠 Create New Property
          <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">Agent</span>
        </h2>
        <p className="text-gray-600 mb-4">Create a professional property listing with AI assistance</p>
        
        {/* Success Statistics - Motivational messaging */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-600 text-lg">📊</span>
            <span className="font-semibold text-amber-900">Complete Listings Outperform by:</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white/60 p-2 rounded">
              <div className="text-lg font-bold text-amber-800">+43%</div>
              <div className="text-xs text-amber-700">More Views</div>
            </div>
            <div className="bg-white/60 p-2 rounded">
              <div className="text-lg font-bold text-amber-800">+31%</div>
              <div className="text-xs text-amber-700">More Inquiries</div>
            </div>
            <div className="bg-white/60 p-2 rounded">
              <div className="text-lg font-bold text-amber-800">2.3x</div>
              <div className="text-xs text-amber-700">Faster Sales</div>
            </div>
            <div className="bg-white/60 p-2 rounded">
              <div className="text-lg font-bold text-amber-800">+25%</div>
              <div className="text-xs text-amber-700">Higher Prices</div>
            </div>
          </div>
          <p className="text-xs text-amber-700 mt-2 text-center italic">Complete information builds buyer confidence and drives results!</p>
        </div>
        
        {/* Performance Score at Top - Keep it prominent */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200 mb-8">
          <CompletionProgress 
            completionPercentage={completionAnalysis.percentage}
            userType="agent"
            missingFields={completionAnalysis.missingFields}
          />
        </div>
        
        <form onSubmit={(e) => propertySubmission.handleSubmit(e, () => performActualSubmission(), false, form.title)} className="space-y-8">
          {/* Auto-save Status Bar - Only for Agents and Landlords */}
          {shouldEnableAutoSave && (
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {autoSaveStatus === 'saving' && (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <span className="text-sm text-gray-600">Saving draft...</span>
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                    <span className="text-sm text-green-600">
                      Draft saved {lastSavedTime && `at ${lastSavedTime.toLocaleTimeString()}`}
                    </span>
                  </>
                )}
                {autoSaveStatus === 'error' && (
                  <>
                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                    <span className="text-sm text-red-600">Save failed</span>
                  </>
                )}
                {autoSaveStatus === 'idle' && autoSave.hasUnsavedChanges && (
                  <span className="text-sm text-gray-500">Unsaved changes</span>
                )}
              </div>
              
              {currentDraftId && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Editing Draft
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {autoSave.filledFieldsCount} fields completed
              </span>
              <button
                type="button"
                onClick={handleManualSave}
                disabled={autoSaveStatus === 'saving'}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors disabled:opacity-50"
              >
                Save Now
              </button>
            </div>
          </div>
          )}

          {/* 1. BASIC INFO (What & Where) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📍 Basic Information
            </h3>
            <div className="space-y-4">
              <GlobalSouthLocationSelector
                selectedCountry={selectedCountry}
                selectedRegion={selectedRegion}
                onLocationChange={handleLocationChange}
                onCurrencyChange={handleCurrencyChange}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Title *</label>
                <input 
                  name="title" 
                  type="text" 
                  placeholder="e.g., Beautiful 3-bedroom family home in Georgetown" 
                  value={form.title} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900 bg-white placeholder-gray-500" 
                />
              </div>
            </div>
          </div>

          {/* 2. LISTING DETAILS (Price & Type) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              💰 Listing Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Price ({currencySymbol}) *</label>
                <input 
                  name="price" 
                  type="number" 
                  placeholder="0" 
                  value={form.price} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                />
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
                  <option value="rent">🏡 For Rent</option>
                  {form.property_category === 'commercial' && (
                    <option value="lease">🏢 For Lease</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* 3. PROPERTY SPECIFICATIONS (Key Features) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🏘️ Property Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms{form.property_category === 'commercial' ? ' (Optional)' : ''}</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms{form.property_category === 'commercial' ? ' (Optional)' : ''}</label>
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
            <CompletionIncentive 
              fieldName="house_size_value"
              fieldType="squareFootage" 
              isCompleted={!!form.house_size_value}
              userType="agent"
            />
          </div>
          {/* 4. LAND INFORMATION (All land details together!) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📐 Land & Property Information
            </h3>
            
            {/* Lot Dimensions */}
            <div className="mb-6">
              <LotDimensions
                length={form.lot_length}
                width={form.lot_width}
                unit={form.lot_dimension_unit as DimensionUnit}
                onLengthChange={(length) => setForm(prev => ({ ...prev, lot_length: length }))}
                onWidthChange={(width) => setForm(prev => ({ ...prev, lot_width: width }))}
                onUnitChange={(unit) => setForm(prev => ({ ...prev, lot_dimension_unit: unit }))}
                onAreaCalculated={(areaSqFt) => {
                  // Auto-update land_size_value with calculated area
                  setForm(prev => ({ 
                    ...prev, 
                    land_size_value: areaSqFt.toString(),
                    land_size_unit: 'sq ft' 
                  }));
                }}
                label="Lot Dimensions (if rectangular)"
              />
            </div>
            
            {/* Total Land Area - DIRECTLY BELOW Dimensions */}
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
            
            {/* Year Built - IN SAME SECTION */}
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
            <CompletionIncentive 
              fieldName="year_built"
              fieldType="yearBuilt" 
              isCompleted={!!form.year_built}
              userType="agent"
            />
          </div>

          {/* 5. AMENITIES & FEATURES (What makes it special) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-teal-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              ✨ Amenities & Features
            </h3>
            
            {/* Enhanced messaging about why amenities matter */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-5 rounded-lg border border-green-200 mb-4">
              <div className="flex items-start gap-3">
                <div className="text-green-600 text-xl">🎯</div>
                <div>
                  <h4 className="font-semibold text-green-900 mb-2">Why Complete Amenities = Better Results</h4>
                  <div className="space-y-1 text-sm text-green-800">
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-green-600 rounded-full"></span>
                      <span><strong>43% more inquiries</strong> - Detailed listings attract serious buyers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-green-600 rounded-full"></span>
                      <span><strong>Faster sales</strong> - Buyers know exactly what they're getting</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-green-600 rounded-full"></span>
                      <span><strong>Better AI descriptions</strong> - More amenities = richer, compelling content</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-green-600 rounded-full"></span>
                      <span><strong>Higher engagement</strong> - Complete listings build buyer confidence</span>
                    </div>
                  </div>
                  <p className="text-xs text-green-700 mt-2 italic">💡 Select amenities first, then let AI create your perfect description!</p>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <AmenitiesSelector
                value={form.amenities || []}
                onChange={(amenities) => {
                  setForm({
                    ...form,
                    amenities
                  });
                }}
              />
            </div>
            <CompletionIncentive 
              fieldName="amenities"
              fieldType="amenities" 
              isCompleted={Array.isArray(form.amenities) && form.amenities.length > 0}
              userType="agent"
            />
          </div>

          {/* 4.5. COMMERCIAL FEATURES (Commercial Properties Only) */}
          {form.property_category === 'commercial' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-indigo-500">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                🏢 Commercial Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    placeholder="e.g., Ground, 2nd, 3-5" 
                    value={form.building_floor} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Floors</label>
                  <input 
                    name="number_of_floors" 
                    type="number" 
                    placeholder="e.g., 1, 2, 3" 
                    value={form.number_of_floors} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input 
                      name="loading_dock" 
                      type="checkbox" 
                      checked={form.loading_dock} 
                      onChange={handleChange} 
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                    />
                    <label className="ml-2 block text-sm text-gray-700">Loading Dock</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      name="elevator_access" 
                      type="checkbox" 
                      checked={form.elevator_access} 
                      onChange={handleChange} 
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                    />
                    <label className="ml-2 block text-sm text-gray-700">Elevator Access</label>
                  </div>
                </div>
                <div className="flex items-center">
                  <input 
                    name="commercial_garage_entrance" 
                    type="checkbox" 
                    checked={form.commercial_garage_entrance} 
                    onChange={handleChange} 
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                  />
                  <label className="ml-2 block text-sm text-gray-700">Commercial Garage Entrance</label>
                </div>
              </div>

              {/* Commercial Lease & Finance Information */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  📋 Lease & Financing Details
                </h4>
                
                {/* Show lease fields only for lease properties */}
                {form.listing_type === 'rent' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lease Term (Years)</label>
                      <select 
                        name="lease_term_years" 
                        value={form.lease_term_years} 
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                      >
                        <option value="">Select lease term</option>
                        <option value="1">1 Year</option>
                        <option value="2">2 Years</option>
                        <option value="3">3 Years</option>
                        <option value="5">5 Years</option>
                        <option value="10">10 Years</option>
                        <option value="15">15 Years</option>
                        <option value="20">20 Years</option>
                        <option value="25">25 Years</option>
                        <option value="99">99 Years</option>
                        <option value="other">Other (specify in details)</option>
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
                        <option value="">Select lease type</option>
                        <option value="gross">Gross Lease (all costs included)</option>
                        <option value="net">Net Lease (tenant pays utilities/maintenance)</option>
                        <option value="triple_net">Triple Net Lease (tenant pays all costs)</option>
                        <option value="modified_gross">Modified Gross Lease</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Financing information (for sale properties) */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input 
                      name="financing_available" 
                      type="checkbox" 
                      checked={form.financing_available} 
                      onChange={handleChange} 
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                    />
                    <label className="ml-2 block text-sm font-medium text-gray-700">
                      Financing Available {form.listing_type === 'rent' ? '(for lease deposits)' : '(for purchase)'}
                    </label>
                  </div>
                  
                  {form.financing_available && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Financing Details
                      </label>
                      <textarea 
                        name="financing_details" 
                        value={form.financing_details} 
                        onChange={handleChange}
                        placeholder="Describe financing options, down payment requirements, approved lenders, etc."
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 6. DESCRIPTION & AI ASSISTANT (Content creation) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-indigo-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📝 Property Description
            </h3>
            
            {/* Description Field with enhanced placeholder */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Write at least 30-50 words about your property... OR use the AI assistant below for professional descriptions! The more details you provide, the better the AI can help. Describe what makes this property special, its location benefits, and key features."
                rows={6}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900 placeholder-gray-400"
              />
              <div className="mt-2 text-xs text-gray-500 flex justify-between">
                <span>💡 Tip: {form.description.trim().split(/\s+/).filter(word => word.length > 0).length < 30 ? `Add ${30 - form.description.trim().split(/\s+/).filter(word => word.length > 0).length} more words for better AI results` : 'Great! AI can now generate excellent descriptions'}</span>
                <span className={form.description.trim().split(/\s+/).filter(word => word.length > 0).length >= 30 ? 'text-green-600' : 'text-amber-600'}>{form.description.trim().split(/\s+/).filter(word => word.length > 0).length} words</span>
              </div>
            </div>
            
            {/* AI Assistant - RIGHT BELOW Description */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <div className="mb-3 text-sm text-blue-800">
                <span className="font-medium">🤖 AI Power Boost:</span> You've selected {(form.amenities || []).length} amenities above - this gives the AI more context to create amazing descriptions!
              </div>
              <AIDescriptionAssistant
                propertyData={{
                  title: form.title,
                  propertyType: form.property_type,
                  propertyCategory: form.property_category,
                  // Residential fields
                  bedrooms: form.bedrooms.toString(),
                  bathrooms: form.bathrooms.toString(),
                  // Commercial fields
                  commercialType: form.commercial_type,
                  floorSize: form.floor_size_sqft,
                  price: form.price,
                  location: `${form.city || ''}, ${form.region || ''}`.replace(/^, |, $/, ''),
                  squareFootage: form.property_category === 'commercial' && form.floor_size_sqft 
                    ? `${form.floor_size_sqft} sq ft` 
                    : form.house_size_value ? `${form.house_size_value} ${form.house_size_unit}` : '',
                  features: [
                    ...(form.amenities || []),
                    form.year_built ? `Built in ${form.year_built}` : '',
                    form.land_size_value ? `${form.land_size_value} ${form.land_size_unit} lot` : '',
                    form.lot_length && form.lot_width ? `Lot dimensions: ${form.lot_length}' x ${form.lot_width}'` : '',
                    // Add commercial-specific features
                    form.property_category === 'commercial' && form.building_floor ? `Floor ${form.building_floor}` : '',
                    form.property_category === 'commercial' && form.number_of_floors ? `${form.number_of_floors} floors total` : '',
                    form.property_category === 'commercial' && form.parking_spaces ? `${form.parking_spaces} parking spaces` : '',
                    form.property_category === 'commercial' && form.loading_dock === true ? 'Loading dock available' : '',
                    form.property_category === 'commercial' && form.elevator_access === true ? 'Elevator access' : '',
                    form.property_category === 'commercial' && form.commercial_garage_entrance === true ? 'Commercial garage entrance' : '',
                    // Add lease information for rental properties
                    form.property_category === 'commercial' && form.listing_type === 'rent' && form.lease_term_years ? `${form.lease_term_years} year lease available` : '',
                    form.property_category === 'commercial' && form.listing_type === 'rent' && form.lease_type ? `${form.lease_type.replace('_', ' ')} lease structure` : '',
                    // Add financing information
                    form.financing_available ? 'Financing available' : '',
                    form.financing_details ? `Financing: ${form.financing_details}` : ''
                  ].filter(Boolean),
                  rentalType: "sale"
                }}
                currentDescription={form.description}
                onDescriptionGenerated={(description) => setForm(prev => ({ ...prev, description }))}
              />
            </div>
          </div>

          {/* 6.5. VIDEO UPLOAD (Premium Tier Feature) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🎥 Property Video
              {canUserUploadVideo && (
                <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full">PREMIUM</span>
              )}
            </h3>
            
            {canUserUploadVideo ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube or Vimeo Video URL
                  </label>
                  <input
                    name="video_url"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                    value={form.video_url}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:border-purple-500 rounded-lg text-gray-900 placeholder-gray-500"
                  />
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <p><strong>📱 Recommended length:</strong> 2-3 minutes for optimal engagement</p>
                    <p><strong>💡 Best practices:</strong> Show key features, lighting, and neighborhood highlights</p>
                    <p><strong>📍 Tip:</strong> Include exterior shots and mention nearby amenities</p>
                  </div>
                </div>
                
                {form.video_url && (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                    <p className="text-green-800 text-sm">
                      ✅ Video URL added! This will help your property stand out and get 3x more engagement.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 p-6 rounded-xl">
                <div className="text-center">
                  <span className="text-4xl mb-4 block">🚀</span>
                  <h4 className="text-lg font-semibold text-purple-800 mb-2">Upgrade to Add Videos!</h4>
                  <p className="text-purple-700 mb-4">{videoUpgradeMessage}</p>
                  <div className="space-y-2 text-sm text-purple-600">
                    <p>✨ Properties with videos get <strong>3x more views</strong></p>
                    <p>⚡ Video listings sell <strong>faster</strong> and for <strong>better prices</strong></p>
                    <p>💼 Stand out from competitors with professional video tours</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Progress Button - Middle of Form */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">💾 Save Your Progress</h4>
                <p className="text-sm text-gray-600">Not ready to submit? Save your work and come back later.</p>
              </div>
              <button
                type="button"
                onClick={handleManualSave}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
              >
                <span>💾</span>
                Save as Draft
              </button>
            </div>
          </div>

          {/* 7. LOCATION DETAILS (Specific address info) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-pink-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📍 Location Details
            </h3>
            <p className="text-sm text-gray-600 mb-4">Country and region are selected above. Add specific location details below:</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specific Area/District</label>
                <input 
                  name="city" 
                  type="text" 
                  placeholder="e.g., Kitty, Campbellville, New Amsterdam" 
                  value={form.city} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900 placeholder-gray-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Neighborhood/Street (Optional)</label>
                <input 
                  name="neighborhood" 
                  type="text" 
                  placeholder="e.g., Main Street, Sheriff Street" 
                  value={form.neighborhood} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900 placeholder-gray-500" 
                />
              </div>
            </div>
          </div>

          {/* 8. CONTACT INFORMATION */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-emerald-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📞 Contact Information
            </h3>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-blue-900 mb-2">How buyers will contact you</h4>
              <p className="text-sm text-blue-800">
                Interested buyers will be able to contact you through WhatsApp. Your contact details will only be shown to serious inquiries.
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
                <strong>Required:</strong> Include country code (+592 for Guyana). Most customers prefer WhatsApp for instant contact.
              </p>
              <div className="bg-green-50 p-3 rounded mt-2">
                <p className="text-sm text-green-800">
                  <strong>💬 Why WhatsApp?</strong> 90% of property inquiries in Guyana happen via WhatsApp. This ensures you get contacted quickly by serious buyers.
                </p>
              </div>
            </div>
          </div>

          {/* 9. PROPERTY IMAGES (Visual proof) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📸 Property Images
            </h3>
            <p className="text-gray-600 mb-6">Upload high-quality photos to attract more buyers. First image will be the main photo.</p>
            <EnhancedImageUpload
              images={images}
              setImages={handleImagesChange}
              maxImages={10}
            />
          </div>

          {/* Error Display */}
          {error && !success && (
            <div className="bg-red-50 border-2 border-red-200 p-6 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-red-500 text-2xl">⚠️</span>
                <div className="text-red-800 font-medium">{error}</div>
              </div>
            </div>
          )}
          
          {/* Submit Button - Sticky at bottom for mobile */}
          {!success && (
            <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6 mt-8 -mx-8 px-8 pb-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleManualSave}
                  className="sm:w-auto px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 text-lg font-semibold rounded-xl border-2 border-gray-300 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>💾</span>
                  Save as Draft
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg py-4 rounded-xl font-bold shadow-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Submitting Property...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      🚀 Submit Property for Review
                    </span>
                  )}
                </button>
              </div>
              <p className="text-center text-sm text-gray-700 mt-3">
                Your property will be reviewed by our team before going live
              </p>
            </div>
          )}
        </form>

        {/* Draft Recovery Dialog */}
        {showDraftDialog && availableDrafts.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📋 Continue Previous Work?
                </h3>
                <p className="text-gray-600 mb-4">
                  We found {availableDrafts.length} unfinished propert{availableDrafts.length === 1 ? 'y' : 'ies'}. 
                  Would you like to continue where you left off?
                </p>
                
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {availableDrafts.map((draft) => (
                    <div 
                      key={draft.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleLoadDraft(draft.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {draft.title || 'Untitled Property'}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {draft.summary}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Last saved: {new Date(draft.last_saved).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDraft(draft.id);
                          }}
                          className="ml-3 text-red-500 hover:text-red-700 text-xs p-1"
                          title="Delete draft"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDraftDialog(false)}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Start Fresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Duplicate Warning Dialog */}
        {propertySubmission.duplicateDetection.showDuplicateWarning && 
         propertySubmission.duplicateDetection.potentialDuplicate && (
          <DuplicateWarningDialog
            potentialDuplicate={propertySubmission.duplicateDetection.potentialDuplicate}
            onConfirm={() => {
              propertySubmission.duplicateDetection.setShowDuplicateWarning(false);
              // Trigger submission bypassing duplicate check
              const event = new Event('submit', { bubbles: true, cancelable: true });
              propertySubmission.handleSubmit(event as any, () => performActualSubmission(), true, form.title);
            }}
            onCancel={() => propertySubmission.duplicateDetection.setShowDuplicateWarning(false)}
          />
        )}

        {/* Success Screen */}
        {success && (
          <PropertySuccessScreen
            redirectPath="/dashboard/agent"
            userType="agent"
          />
        )}
      </div>
    </div>
  );
}
