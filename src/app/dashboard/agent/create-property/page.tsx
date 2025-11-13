
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
// Draft Management (Manual saves only - auto-save disabled)
// import { useAutoSave } from "@/hooks/useAutoSave"; // DISABLED - causing duplicate drafts
import { saveDraft, loadUserDrafts, loadDraft, deleteDraft } from "@/lib/draftManager";
// import { isAutoSaveEligible, getAutoSaveSettings } from "@/lib/autoSaveEligibility"; // DISABLED


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
            
            // Auto-save completely disabled - using manual save only
            setAutoSaveEnabled(false);
            
            console.log('User profile loaded:', {
              email: profileData.email,
              user_type: profileData.user_type,
              autoSaveEligible: false
            });

            // Check for draft ID in URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const draftId = urlParams.get('draft');
            if (draftId) {
              console.log('Loading draft from URL:', draftId);
              await handleLoadDraft(draftId);
            }
            
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

  // AUTO-SAVE COMPLETELY DISABLED - Manual save only to prevent duplicate drafts
  // const autoSaveSettings = userProfile ? getAutoSaveSettings(userProfile) : { enabled: false, interval: 0, minFieldsRequired: 0 };
  // const autoSave = useAutoSave({ ... }); // REMOVED - was causing duplicate draft creation

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
        });
        
        // Set location/currency data
        if (draftData.location) {
          setSelectedCountry(draftData.location);
        }
        if (draftData.region) {
          setSelectedRegion(draftData.region);
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
      setAutoSaveStatus('saving');
      // Direct save call instead of using auto-save hook
      const result = await saveDraft({ ...form, images }, currentDraftId || undefined);
      if (result.success) {
        setAutoSaveStatus('saved');
        setLastSavedTime(new Date());
        if (result.draftId && !currentDraftId) {
          setCurrentDraftId(result.draftId);
        }
      } else {
        setAutoSaveStatus('error');
      }
    } catch (error) {
      console.error('❌ Manual save error:', error);
      setAutoSaveStatus('error');
    }
  };

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

    if (images.length < 1) {
      throw new Error("Please upload at least one image.");
    }

    try {
      // The API route will handle all authentication server-side with @supabase/ssr
      console.log('🔍 Starting property creation - authentication handled by API route');

      // Prepare images for upload - convert File objects to base64
      const imagesForUpload = await Promise.all(
        images.map(async (file: File) => {
          return new Promise<{name: string, type: string, data: string}>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
              name: file.name,
              type: file.type,
              data: reader.result as string, // Already in data: URL format
            });
            reader.readAsDataURL(file);
          });
        })
      );

      // Create property using API route for proper server-side authentication
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
          images: imagesForUpload,
          lot_length: form.lot_length ? Number(form.lot_length) : null,
          lot_width: form.lot_width ? Number(form.lot_width) : null,
          lot_dimension_unit: form.lot_dimension_unit,
          owner_whatsapp: form.owner_whatsapp,
          video_url: form.video_url.trim() || null, // Only include video URL if user has access and provided one
          // userId will be extracted server-side from authenticated session
          propertyCategory: form.listing_type === 'sale' ? 'sale' : 'rental', // Map to API format
          site_id: 'guyana',  // ADD THIS LINE ONLY
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
      
      // Show success message with options
      setSuccess("✅ Property created successfully!");
      setError("");
      setLoading(false);
      
      // Immediate redirect to prevent double submission
      setTimeout(() => router.push('/dashboard/agent'), 1000);
      
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
          {/* Protective Save Reminder - Always Visible */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                ⚠️
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-yellow-800 font-semibold text-sm">Don't Lose Your Progress!</h4>
                  <div className="flex items-center gap-2 text-xs text-yellow-700">
                    {currentDraftId && (
                      <span className="bg-yellow-200 px-2 py-1 rounded">Editing Draft</span>
                    )}
                    <span>{completionAnalysis.completedFields.length} fields completed</span>
                  </div>
                </div>
                
                <p className="text-yellow-700 text-sm mb-3">
                  📱 Taking a call? Getting interrupted? Save your work now to protect your listing progress.
                </p>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleManualSave}
                    disabled={autoSaveStatus === 'saving' || (!form.title.trim() && !form.description.trim() && !form.price.trim() && images.length === 0)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {autoSaveStatus === 'saving' ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Saving...
                      </span>
                    ) : (
                      '💾 SAVE DRAFT NOW'
                    )}
                  </button>
                  
                  {autoSaveStatus === 'saved' && lastSavedTime && (
                    <span className="text-green-700 font-medium text-sm">
                      ✅ Saved at {lastSavedTime.toLocaleTimeString()}
                    </span>
                  )}
                  
                  {autoSaveStatus === 'error' && (
                    <span className="text-red-700 font-medium text-sm">
                      ❌ Save failed - try again
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

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
                  <option value="House">🏠 House</option>
                  <option value="Apartment">🏢 Apartment</option>
                  <option value="Land">🌿 Land</option>
                  <option value="Commercial">🏢 Commercial</option>
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
                  bedrooms: form.bedrooms.toString(),
                  bathrooms: form.bathrooms.toString(),
                  price: form.price,
                  location: `${form.city || ''}, ${form.region || ''}`.replace(/^, |, $/, ''),
                  squareFootage: form.house_size_value ? `${form.house_size_value} ${form.house_size_unit}` : '',
                  features: [
                    ...(form.amenities || []),
                    form.year_built ? `Built in ${form.year_built}` : '',
                    form.land_size_value ? `${form.land_size_value} ${form.land_size_unit} lot` : '',
                    form.lot_length && form.lot_width ? `Lot dimensions: ${form.lot_length}' x ${form.lot_width}'` : ''
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
          {/* 10. SUBMIT */}
          {/* Success message with options */}
          {success && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-8 rounded-xl shadow-sm">
              <div className="text-center">
                <div className="text-4xl mb-4">🎉</div>
                <div className="text-green-800 text-xl font-bold mb-4">{success}</div>
                <div className="space-y-4">
                  <p className="text-green-700 text-sm">What would you like to do next?</p>
                  <div className="flex gap-4 flex-wrap justify-center">
                    <button 
                      onClick={handleCreateAnother}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                    >
                      ➕ Create Another Property
                    </button>
                    <button 
                      onClick={handleGoToDashboard}
                      className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 transform hover:scale-105"
                    >
                      🏠 Go to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 p-6 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-red-500 text-2xl">⚠️</span>
                <div className="text-red-800 font-medium">{error}</div>
              </div>
            </div>
          )}
          
          {/* Action Buttons - Sticky at bottom for mobile */}
          {!success && (
            <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6 mt-8 -mx-8 px-8 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                
                {/* Save Draft Button - Always Available */}
                <button 
                  type="button"
                  onClick={handleManualSave}
                  disabled={autoSaveStatus === 'saving' || (!form.title.trim() && !form.description.trim() && !form.price.trim() && images.length === 0)}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-lg py-4 rounded-xl font-bold shadow-lg hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {autoSaveStatus === 'saving' ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Saving Draft...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      💾 Save Draft
                    </span>
                  )}
                </button>

                {/* Submit for Review - When Ready */}
                <button 
                  type="submit" 
                  disabled={loading || completionAnalysis.percentage < 60} 
                  className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-lg py-4 rounded-xl font-bold shadow-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      🚀 Submit for Review
                    </span>
                  )}
                </button>
              </div>
              
              <div className="text-center space-y-1">
                {completionAnalysis.percentage < 60 ? (
                  <p className="text-sm text-orange-600 font-medium">
                    💡 Complete {Math.ceil((60 - completionAnalysis.percentage) / 10)} more fields to submit for review
                  </p>
                ) : (
                  <p className="text-sm text-green-600 font-medium">
                    ✅ Ready for submission! Your property will be reviewed by our team
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Save drafts anytime • Submit when {completionAnalysis.percentage}% complete
                </p>
              </div>
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
