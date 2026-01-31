'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/supabase';
import Link from 'next/link';
import GlobalSouthLocationSelector from "@/components/GlobalSouthLocationSelector";
import EnhancedImageUpload from "@/components/EnhancedImageUpload";
import AIDescriptionAssistant from "@/components/AIDescriptionAssistant";
import { getCurrencySymbol } from "@/lib/currency";

// Simplified property types matching CREATE form
const PROPERTY_TYPES = [
  { value: "House", label: "House" },
  { value: "Land", label: "Land" },
  { value: "Commercial", label: "Commercial Building" },
];

// Simplified amenities matching CREATE form - value/label pairs
const VISIBLE_FEATURES = [
  { value: "AC", label: "Air Conditioning" },
  { value: "Pool", label: "Swimming Pool" },
  { value: "Garage", label: "Garage" },
  { value: "Garden", label: "Garden" },
  { value: "Gated", label: "Gated Community" },
  { value: "Backup Generator", label: "Generator" },
  { value: "Internet", label: "Internet Ready" },
  { value: "Laundry", label: "Laundry Room" },
  { value: "Balcony", label: "Balcony/Patio" },
  { value: "Parking", label: "Parking" },
];

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
  listingType: string;
};

export default function EditFSBOProperty() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<string>("GY");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [currencyCode, setCurrencyCode] = useState<string>("GYD");
  const [currencySymbol, setCurrencySymbol] = useState<string>("GY$");

  // Existing images from database
  const [existingImages, setExistingImages] = useState<string[]>([]);
  // Images marked for removal
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  // New images to upload
  const [newImages, setNewImages] = useState<File[]>([]);

  // Track admin status for navigation and permissions
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState<PropertyForm>({
    title: '',
    description: '',
    price: '',
    location: '',
    propertyType: 'House',
    bedrooms: '',
    bathrooms: '',
    squareFootage: '',
    features: [],
    status: 'pending',
    listingType: 'sale',
  });

  const imageLimit = 8;

  // Check if property type requires bedrooms/bathrooms
  const requiresBedsBaths = formData.propertyType === "House";

  // Load existing property data
  useEffect(() => {
    async function loadPropertyData() {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
          router.push('/login');
          return;
        }
        setUser(authUser);

        // Check if user is an admin
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('admin_level, country_id, user_type')
          .eq('id', authUser.id)
          .single();

        const userAdminLevel = userProfile?.admin_level;
        const isUserAdmin = userAdminLevel && ['super', 'owner'].includes(userAdminLevel);
        setIsAdmin(!!isUserAdmin);

        // Verify user is FSBO or admin
        if (!isUserAdmin && userProfile?.user_type !== 'fsbo' && userProfile?.user_type !== 'owner') {
          router.push('/dashboard');
          return;
        }

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

        // Apply access control
        if (isUserAdmin) {
          if (userAdminLevel === 'super') {
            console.log('🔓 Super Admin: Full edit access');
          } else if (userAdminLevel === 'owner' && userProfile?.country_id) {
            propertyQuery = propertyQuery.eq('country_id', userProfile.country_id);
          }
        } else {
          propertyQuery = propertyQuery.eq('user_id', authUser.id);
        }

        const { data: property, error: propertyError } = await propertyQuery.single();

        if (propertyError || !property) {
          console.error('Error loading property:', propertyError);
          setError('Property not found or access denied');
          setLoading(false);
          return;
        }

        // Populate form data
        setFormData({
          title: property.title || '',
          description: property.description || '',
          price: property.price?.toString() || '',
          location: property.location || '',
          propertyType: property.property_type || 'House',
          bedrooms: property.bedrooms?.toString() || '',
          bathrooms: property.bathrooms?.toString() || '',
          squareFootage: property.house_size_value?.toString() || '',
          features: Array.isArray(property.amenities) ? property.amenities : [],
          status: property.status || 'pending',
          listingType: property.listing_type || 'sale',
        });

        // Set location info
        const countryCode = property.country || property.country_id || 'GY';
        setSelectedCountry(countryCode);
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
        setLoading(false);

      } catch (error) {
        console.error('Error loading property data:', error);
        setError('Failed to load property data');
        setLoading(false);
      }
    }

    if (propertyId) {
      loadPropertyData();
    }
  }, [propertyId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox' && name === 'features') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        features: checked
          ? [...prev.features, value]
          : prev.features.filter(f => f !== value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle property type change - clear beds/baths when switching away from House
  const handlePropertyTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      propertyType: value,
      bedrooms: value === "House" ? prev.bedrooms : "",
      bathrooms: value === "House" ? prev.bathrooms : "",
    }));
  };

  const handleLocationChange = (field: 'country' | 'region', value: string) => {
    if (field === 'country') {
      setSelectedCountry(value);
      setSelectedRegion('');
    } else {
      setSelectedRegion(value);
    }
  };

  const handleCurrencyChange = (code: string, symbol: string) => {
    setCurrencyCode(code);
    setCurrencySymbol(symbol);
  };

  // Remove an existing image
  const handleRemoveExistingImage = (imageUrl: string) => {
    setImagesToRemove(prev => [...prev, imageUrl]);
    setExistingImages(prev => prev.filter(url => url !== imageUrl));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submittingRef.current || isSubmitting) {
      console.log('⚠️ Double-submit blocked');
      return;
    }

    // Validate required fields
    if (!formData.title || !formData.description || !formData.price || !formData.location) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate beds/baths for House type
    if (formData.propertyType === "House") {
      if (!formData.bedrooms) {
        setError("Number of bedrooms is required for houses");
        return;
      }
      if (!formData.bathrooms) {
        setError("Number of bathrooms is required for houses");
        return;
      }
    }

    // Validate at least one image (existing or new)
    const remainingImages = existingImages.length;
    const totalImages = remainingImages + newImages.length;

    if (totalImages < 1) {
      setError('Please keep at least one image or upload a new one');
      return;
    }

    if (totalImages > imageLimit) {
      setError(`Maximum ${imageLimit} images allowed. You have ${totalImages}.`);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setError('');

    try {
      // Upload new images to Supabase Storage
      let newImageUrls: string[] = [];
      if (newImages.length > 0) {
        console.log('📤 Uploading new images to Supabase Storage...');
        const { uploadImagesToSupabase } = await import('@/lib/supabaseImageUpload');
        const uploadedImages = await uploadImagesToSupabase(newImages, user.id);
        newImageUrls = uploadedImages.map(img => img.url);
        console.log(`✅ ${newImageUrls.length} new images uploaded`);
      }

      // Prepare property data for update
      const propertyData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        property_type: formData.propertyType,
        listing_type: formData.listingType,
        bedrooms: formData.propertyType === "House" ? parseInt(formData.bedrooms) || null : null,
        bathrooms: formData.propertyType === "House" ? parseFloat(formData.bathrooms) || null : null,
        house_size_value: parseFloat(formData.squareFootage) || null,
        house_size_unit: 'sq ft',
        amenities: formData.features,
        location: formData.location,
        country: selectedCountry,
        region: selectedRegion,
        city: selectedRegion,
        currency: currencyCode,
        site_id: selectedCountry === 'JM' ? 'jamaica' : 'guyana',
        updated_at: new Date().toISOString(),
      };

      // Update property via API - send new image URLs
      const response = await fetch(`/api/properties/update/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...propertyData,
          imageUrls: newImageUrls, // New images to add
          imagesToRemove: imagesToRemove, // Images to delete (for future implementation)
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update property');
      }

      setSuccess(true);

      // Redirect back to dashboard after success
      setTimeout(() => {
        const dashboardUrl = isAdmin ? '/admin-dashboard/unified' : '/dashboard/fsbo';
        router.push(dashboardUrl);
      }, 2000);

    } catch (error) {
      console.error('Update error:', error);
      setError((error as Error).message || 'Failed to update property. Please try again.');
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  const getDashboardUrl = () => isAdmin ? '/admin-dashboard/unified' : '/dashboard/fsbo';

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading property...</p>
      </main>
    );
  }

  if (error && !formData.title) {
    return (
      <main className="max-w-2xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => router.push(getDashboardUrl())}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Back to Dashboard
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-6">
        <Link href={getDashboardUrl()} className="text-orange-600 hover:underline text-sm">
          ← Back to {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-orange-700 mb-2">
        {isAdmin ? '✏️ Admin: Edit FSBO Property' : 'Edit Property Listing'}
      </h1>
      <p className="text-gray-600 mb-6">Update your property details below</p>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-green-800 text-xl font-bold mb-1">Property updated successfully!</div>
            <div className="text-green-700 text-sm">Redirecting to dashboard...</div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow">

        {/* 1. EXISTING IMAGES */}
        {existingImages.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Current Photos ({existingImages.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {existingImages.map((url, index) => (
                <div key={url} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={url}
                      alt={`Property image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {index === 0 && (
                    <div className="absolute top-1 left-1 bg-orange-600 text-white text-xs px-2 py-0.5 rounded">
                      Main
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(url)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Remove image"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Hover over an image and click ✕ to remove it
            </p>
          </div>
        )}

        {/* 2. ADD NEW PHOTOS */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
          <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
            📸 {existingImages.length > 0 ? 'Add More Photos' : 'Add Photos'}
          </h3>
          <p className="text-sm text-orange-800 mb-4">
            {existingImages.length > 0
              ? `You can add up to ${imageLimit - existingImages.length} more photos`
              : 'Upload at least 1 photo (up to 8 max)'
            }
          </p>
          <EnhancedImageUpload
            images={newImages}
            setImages={setNewImages}
            maxImages={imageLimit - existingImages.length}
          />
        </div>

        {/* 3. PROPERTY TYPE - 3 options only */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Type *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {PROPERTY_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handlePropertyTypeChange(type.value)}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  formData.propertyType === type.value
                    ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">
                  {type.value === 'House' ? '🏠' : type.value === 'Land' ? '🌿' : '🏢'}
                </div>
                <div className="text-sm font-medium text-gray-700">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 4. PRICE + LISTING TYPE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.listingType === 'rent' ? 'Monthly Rent' : 'Sale Price'} ({currencySymbol}) *
            </label>
            <input
              type="number"
              inputMode="numeric"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              placeholder="25000000"
              className="w-full border rounded-lg px-4 py-3 text-base"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.price && !isNaN(Number(formData.price)) && Number(formData.price) > 0
                ? `Displays as: ${currencySymbol}${Number(formData.price).toLocaleString()}`
                : `Example: 25,000,000 (digits only)`
              }
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type</label>
            <select
              name="listingType"
              value={formData.listingType}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 text-base"
            >
              <option value="sale">For Sale</option>
              <option value="rent">For Rent</option>
            </select>
          </div>
        </div>

        {/* 5. COUNTRY + REGION */}
        <GlobalSouthLocationSelector
          selectedCountry={selectedCountry}
          selectedRegion={selectedRegion}
          onLocationChange={handleLocationChange}
          onCurrencyChange={handleCurrencyChange}
        />

        {/* 6. ADDRESS/LOCATION */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Address/Location *
          </label>
          <input
            name="location"
            type="text"
            placeholder="e.g., Lot 5 Lamaha Gardens, Georgetown"
            value={formData.location}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 text-base"
            required
          />
        </div>

        {/* 7 & 8. BEDROOMS & BATHROOMS - Only for House type */}
        {requiresBedsBaths && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms *
              </label>
              <input
                name="bedrooms"
                type="number"
                inputMode="numeric"
                placeholder="3"
                value={formData.bedrooms}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-base"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms *
              </label>
              <input
                name="bathrooms"
                type="number"
                inputMode="numeric"
                placeholder="2"
                value={formData.bathrooms}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-base"
                required
                min="0"
              />
            </div>
          </div>
        )}

        {/* 9. AMENITIES - 10 checkboxes only */}
        <div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-500 text-lg">💡</div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Pro Tip: Select features first!</h4>
                <p className="text-sm text-blue-800">
                  The more features you select, the better our AI will generate your property description.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-2 font-semibold text-gray-700">Features/Amenities:</div>
          <div className="grid grid-cols-2 gap-2">
            {VISIBLE_FEATURES.map(({ value, label }) => (
              <label
                key={value}
                className="flex items-center gap-3 text-gray-900 font-medium cursor-pointer hover:bg-gray-50 p-3 rounded-lg border border-transparent hover:border-gray-200 active:bg-gray-100"
              >
                <input
                  type="checkbox"
                  name="features"
                  value={value}
                  checked={formData.features.includes(value)}
                  onChange={handleChange}
                  className="w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
          {formData.features.length > 0 && (
            <p className="text-sm text-green-600 mt-2">
              {formData.features.length} features selected
            </p>
          )}
        </div>

        {/* 10. DESCRIPTION + AI Assistant */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Property Description *</label>
          <textarea
            name="description"
            placeholder="Write at least 30-50 words about your property... OR use the AI assistant below!"
            value={formData.description}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 text-base placeholder-gray-400"
            required
            rows={6}
          />
          <div className="mt-2 text-xs text-gray-500 flex justify-between">
            <span>
              💡 Tip: {formData.description.trim().split(/\s+/).filter(word => word.length > 0).length < 30
                ? `Add ${30 - formData.description.trim().split(/\s+/).filter(word => word.length > 0).length} more words for better AI results`
                : 'Great! AI can now generate excellent descriptions'}
            </span>
            <span className={formData.description.trim().split(/\s+/).filter(word => word.length > 0).length >= 30 ? 'text-green-600' : 'text-amber-600'}>
              {formData.description.trim().split(/\s+/).filter(word => word.length > 0).length} words
            </span>
          </div>
        </div>

        {/* AI Description Assistant */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
          <div className="mb-3 text-sm text-blue-800">
            <span className="font-medium">🤖 AI Power Boost:</span> You've selected {formData.features.length} features above - this gives the AI more context!
          </div>
          <AIDescriptionAssistant
            propertyData={{
              title: formData.title,
              propertyType: formData.propertyType,
              bedrooms: formData.bedrooms,
              bathrooms: formData.bathrooms,
              price: formData.price,
              location: formData.location,
              squareFootage: formData.squareFootage,
              features: formData.features,
              rentalType: formData.listingType === 'rent' ? 'rent' : 'sale'
            }}
            currentDescription={formData.description}
            onDescriptionGenerated={(description) => setFormData(prev => ({ ...prev, description }))}
          />
        </div>

        {/* 11. TITLE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Title *
          </label>
          <input
            name="title"
            type="text"
            placeholder="e.g., 'Beautiful 3BR House in Georgetown'"
            value={formData.title}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 text-base"
            required
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.title.length}/100 characters - Make it descriptive and appealing!
          </p>
        </div>

        {/* 12. SUBMIT BUTTON */}
        {!success && (
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Updating Property...
              </span>
            ) : (
              '💾 Save Changes'
            )}
          </button>
        )}
      </form>
    </main>
  );
}
