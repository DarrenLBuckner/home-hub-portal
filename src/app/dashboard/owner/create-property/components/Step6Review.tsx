interface Step6ReviewProps {
  formData: any;
  images: File[];
}

export default function Step6Review({ formData, images }: Step6ReviewProps) {
  const formatPrice = (price: string) => {
    if (!price || isNaN(Number(price))) return 'Not specified';
    return `GYD ${Number(price).toLocaleString()}`;
  };

  const formatAmenities = (amenities: string[]) => {
    if (!amenities || amenities.length === 0) return 'None selected';
    return amenities.join(', ');
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold mb-4">Review Your Listing</h2>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-medium text-green-900 mb-2">Ready to Submit</h3>
        <p className="text-sm text-green-800">
          Please review all the information below. Once submitted, your property will be reviewed by our team 
          and published within 1-2 business days.
        </p>
      </div>

      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Property Title</p>
            <p className="mt-1 text-gray-900">{formData.title || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Property Type</p>
            <p className="mt-1 text-gray-900">{formData.property_type}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Asking Price</p>
            <p className="mt-1 text-gray-900 font-semibold">{formatPrice(formData.price)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Listing Type</p>
            <p className="mt-1 text-gray-900">For Sale (FSBO)</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-500">Description</p>
          <p className="mt-1 text-gray-900 text-sm">{formData.description || 'No description provided'}</p>
        </div>
      </div>

      {/* Property Details */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Property Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Bedrooms</p>
            <p className="mt-1 text-gray-900">{formData.bedrooms || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Bathrooms</p>
            <p className="mt-1 text-gray-900">{formData.bathrooms || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">House Size</p>
            <p className="mt-1 text-gray-900">
              {formData.house_size_value 
                ? `${formData.house_size_value} ${formData.house_size_unit}` 
                : 'Not specified'
              }
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Land Size</p>
            <p className="mt-1 text-gray-900">
              {formData.land_size_value 
                ? `${formData.land_size_value} ${formData.land_size_unit}` 
                : 'Not specified'
              }
            </p>
          </div>
        </div>
        {formData.year_built && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Year Built</p>
            <p className="mt-1 text-gray-900">{formData.year_built}</p>
          </div>
        )}
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-500">Amenities & Features</p>
          <p className="mt-1 text-gray-900 text-sm">{formatAmenities(formData.amenities)}</p>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Region</p>
            <p className="mt-1 text-gray-900">{formData.region || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">City/Town</p>
            <p className="mt-1 text-gray-900">{formData.city || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Neighborhood</p>
            <p className="mt-1 text-gray-900">{formData.neighborhood || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Photos ({images.length})</h3>
        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.slice(0, 8).map((image, index) => (
              <div key={index} className="relative">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Main
                  </div>
                )}
              </div>
            ))}
            {images.length > 8 && (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500 text-sm">+{images.length - 8} more</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No photos uploaded</p>
        )}
      </div>

      {/* Contact Information */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="mt-1 text-gray-900">{formData.owner_email || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">WhatsApp</p>
            <p className="mt-1 text-gray-900">{formData.owner_whatsapp || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Final Notice */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">What Happens Next?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Your listing will be reviewed by our team within 1-2 business days</li>
          <li>• You'll receive an email notification once it's approved and published</li>
          <li>• Your property will appear on the Guyana Home Hub website</li>
          <li>• You can edit or manage your listing anytime from your dashboard</li>
          <li>• We'll notify you of any inquiries or interest from potential buyers</li>
        </ul>
      </div>
    </div>
  );
}