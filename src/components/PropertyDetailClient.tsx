'use client';

import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';

interface PropertyDetailProps {
  property: any;
}

// Map country codes to site domains for multi-tenant support
const COUNTRY_TO_DOMAIN: Record<string, string> = {
  'GY': 'guyanahomehub.com',
  'JM': 'jamaicahomehub.com',
  'TT': 'trinidadhomehub.com',
  'BB': 'barbadoshomehub.com',
  'BS': 'bahamashomehub.com',
  'KE': 'kenyahomehub.com',
  'NG': 'nigeriahomehub.com',
  'GH': 'ghanahomehub.com',
  'ZA': 'southafricahomehub.com',
};

function getSiteDomain(countryId: string | undefined): string {
  if (!countryId) return 'guyanahomehub.com';
  return COUNTRY_TO_DOMAIN[countryId.toUpperCase()] || 'guyanahomehub.com';
}

export default function PropertyDetailClient({ property }: PropertyDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get WhatsApp number (priority: property-specific, then user's phone)
  const getWhatsAppNumber = () => {
    return property.owner_whatsapp || property.owner?.phone || null;
  };

  // Format WhatsApp number for link
  const formatWhatsAppNumber = (phone: string) => {
    if (!phone) return null;

    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');

    // Add Guyana country code (592) if not present
    if (!cleaned.startsWith('592') && cleaned.length === 7) {
      cleaned = '592' + cleaned;
    }

    return cleaned;
  };

  // Format price display
  const formatPrice = (price: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency === 'GYD' ? 'GY$' : currency || 'GY$';
    return `${symbol}${price?.toLocaleString() || 0}`;
  };

  // Get property reference ID (last 6 chars of UUID for easy reference)
  const propertyRef = property.id?.slice(-6)?.toUpperCase() || 'N/A';

  // Get dynamic domain based on property's country
  const siteDomain = getSiteDomain(property.country_id);
  const propertyUrl = `https://${siteDomain}/properties/${property.id}`;
  const priceDisplay = `${formatPrice(property.price, property.currency)}${property.listing_type === 'rent' ? '/month' : ''}`;
  const locationDisplay = property.city || property.region || 'Location not specified';

  // Create WhatsApp link with property reference at start for agent tracking
  const whatsappNumber = formatWhatsAppNumber(getWhatsAppNumber());
  const whatsappMessage = encodeURIComponent(
    `[Ref: ${propertyRef}] Hi! I'm interested in this property:\n\n` +
    `${property.title}\n` +
    `Price: ${priceDisplay}\n` +
    `Location: ${locationDisplay}\n\n` +
    `Property Link: ${propertyUrl}`
  );
  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`
    : null;

  // Create mailto link with property context pre-filled
  const getEmailLink = (email: string) => {
    const subject = encodeURIComponent(`[Ref: ${propertyRef}] Inquiry about: ${property.title}`);
    const body = encodeURIComponent(
      `Hi,\n\n` +
      `I'm interested in this property:\n\n` +
      `Property: ${property.title}\n` +
      `Reference: ${propertyRef}\n` +
      `Price: ${priceDisplay}\n` +
      `Location: ${locationDisplay}\n` +
      `Link: ${propertyUrl}\n\n` +
      `My question is:\n\n`
    );
    return `mailto:${email}?subject=${subject}&body=${body}`;
  };

  // Get owner display name
  const ownerName = property.owner 
    ? `${property.owner.first_name || ''} ${property.owner.last_name || ''}`.trim() || 'Property Owner'
    : 'Property Owner';

  // Property images
  const images = property.images || [];
  const mainImage = images[0] || null;

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Link 
            href={property.listing_type === 'rent' ? '/properties/rent' : '/properties/buy'}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to {property.listing_type === 'rent' ? 'Rentals' : 'Properties for Sale'}
          </Link>
        </div>
      </div>

      {/* Property Images */}
      <div className="relative h-64 md:h-96 w-full bg-gray-200">
        {mainImage ? (
          <>
            <Image
              src={images[currentImageIndex] || mainImage}
              alt={property.title}
              fill
              className="object-cover"
              priority
            />
            
            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full hover:bg-black/70 transition p-3"
                  aria-label="Previous image"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full hover:bg-black/70 transition p-3"
                  aria-label="Next image"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl text-gray-400 mb-2">🏠</div>
              <p className="text-gray-500">No image available</p>
            </div>
          </div>
        )}
        
        {/* Property Status Ribbon - replaces "FOR SALE" when status changes */}
        <div className="absolute top-4 left-4 z-20">
          {(() => {
            // Priority order: sold > under_contract > active (with listing type)
            if (property.status === 'sold') {
              return (
                <div className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-lg">
                  SOLD
                </div>
              );
            }
            if (property.status === 'under_contract') {
              return (
                <div className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-lg">
                  PENDING
                </div>
              );
            }
            // Active status - show listing type
            return (
              <div className={`text-white text-sm font-bold px-4 py-2 rounded-lg shadow-lg ${
                property.listing_type === 'rent' ? 'bg-blue-600' : 'bg-green-600'
              }`}>
                {property.listing_type === 'rent' ? 'FOR RENT' : 'FOR SALE'}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Property Details */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Title and Price */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start gap-3 mb-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex-1">
                  {property.title}
                </h1>
                {/* FSBO Badge - separate from status ribbon */}
                {(property.listed_by_type === 'owner' || property.listed_by_type === 'fsbo' || property.owner?.user_type === 'owner') && (
                  <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-orange-100 text-orange-800 border border-orange-300 rounded-full">
                    🏠 For Sale By Owner
                  </span>
                )}
              </div>
              
              <p className="text-3xl font-bold text-emerald-600 mb-2">
                {formatPrice(property.price, property.currency)}
                {property.listing_type === 'rent' && (
                  <span className="text-lg text-gray-600 font-normal">/month</span>
                )}
              </p>

              {/* Availability — hero section, near price (Zillow/Property24 standard) */}
              {(property.listing_type === 'rent' || property.listing_type === 'lease' || property.listing_type === 'short_term_rent') && (() => {
                const af = (property as any).available_from;
                if (!af || new Date(af) <= new Date()) {
                  return (
                    <span className="inline-block text-sm font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200 mb-3">
                      Available Now
                    </span>
                  );
                }
                const label = new Date(af).toLocaleString('default', { month: 'long', year: 'numeric' });
                return (
                  <span className="inline-block text-sm font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 mb-3">
                    Available from {label}
                  </span>
                );
              })()}

              <p className="text-gray-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {property.city || property.region || 'Guyana'}
                {property.neighborhood && `, ${property.neighborhood}`}
              </p>
            </div>

            {/* Property Features */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Property Details</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {property.bedrooms && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">{property.bedrooms}</p>
                    <p className="text-sm text-gray-600">Bedrooms</p>
                  </div>
                )}
                
                {property.bathrooms && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">{property.bathrooms}</p>
                    <p className="text-sm text-gray-600">Bathrooms</p>
                  </div>
                )}
                
                {property.house_size_value && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">{property.house_size_value.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{property.house_size_unit || 'Sq Ft'}</p>
                  </div>
                )}
                
                {property.property_type && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-emerald-600 capitalize">{property.property_type}</p>
                    <p className="text-sm text-gray-600">Type</p>
                  </div>
                )}
              </div>
              
              {/* Additional Details */}
              {(property.land_size_value || property.year_built) && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {property.land_size_value && (
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xl font-bold text-blue-600">{property.land_size_value.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Land Size ({property.land_size_unit || 'sq ft'})</p>
                    </div>
                  )}
                  
                  {property.year_built && (
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xl font-bold text-blue-600">{property.year_built}</p>
                      <p className="text-sm text-gray-600">Year Built</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            {property.description && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {property.description}
                </p>
              </div>
            )}

            {/* Rental-Specific Info */}
            {property.listing_type === 'rent' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Rental Information</h2>
                <div className="space-y-3">
                  {/* Availability — always shown for rentals */}
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Availability:</span>
                    {(() => {
                      const af = (property as any).available_from;
                      if (!af || new Date(af) <= new Date()) {
                        return <span className="font-semibold text-green-600">Available Now</span>;
                      }
                      const label = new Date(af).toLocaleString('default', { month: 'long', year: 'numeric' });
                      return <span className="font-semibold text-amber-600">From {label}</span>;
                    })()}
                  </div>
                  {property.deposit_amount && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Security Deposit:</span>
                      <span className="font-semibold">{formatPrice(property.deposit_amount, property.currency)}</span>
                    </div>
                  )}
                  {property.lease_length && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Lease Length:</span>
                      <span className="font-semibold">{property.lease_length} months</span>
                    </div>
                  )}
                  {property.furnished !== null && property.furnished !== undefined && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Furnished:</span>
                      <span className="font-semibold">{property.furnished ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                  {property.pet_policy && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pet Policy:</span>
                      <span className="font-semibold capitalize">{property.pet_policy}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity: string, index: number) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm"
                    >
                      {amenity.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact Sidebar (Desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-4">
              <ContactCard
                ownerName={ownerName}
                userType={property.owner?.user_type}
                whatsappLink={whatsappLink}
                emailLink={property.owner_email || property.owner?.email ? getEmailLink(property.owner_email || property.owner?.email) : undefined}
                propertyStatus={property.status}
                listedByType={property.listed_by_type}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Contact Button - Status-aware */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 lg:hidden z-50 shadow-lg">
        {(() => {
          // Sold properties - no contact button
          if (property.status === 'sold') {
            return (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-700 font-medium">🏆 This property has been sold</p>
              </div>
            );
          }
          
          // Under contract - backup offers
          if (property.status === 'under_contract') {
            const buttonText = property.listed_by_type === 'owner' ? 'Contact Owner (Backup Offers)' : 'Contact Agent (Backup Offers)';
            
            if (whatsappLink) {
              return (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-300"
                >
                  <WhatsAppIcon />
                  {buttonText}
                </a>
              );
            } else {
              return (
                <a
                  href="https://wa.me/5926001234?text=Hi! I'm interested in making a backup offer for this property that's under contract."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-300"
                >
                  <WhatsAppIcon />
                  Backup Offers Welcome
                </a>
              );
            }
          }
          
          // Active - normal contact
          const buttonText = property.listed_by_type === 'owner' ? 'Contact Owner via WhatsApp' : 'Contact via WhatsApp';
          
          if (whatsappLink) {
            return (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-300"
              >
                <WhatsAppIcon />
                {buttonText}
              </a>
            );
          } else {
            return (
              <a
                href="https://wa.me/5926001234?text=Hi! I need help contacting the property owner for this listing."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.52 3.449c-2.28-1.23-4.99-1.89-7.77-1.89C6.03 1.56.84 6.74.84 12.45c0 2.18.58 4.32 1.68 6.22L0 24l5.42-1.44c1.84.98 3.9 1.49 6.02 1.49 6.72 0 12.18-5.46 12.18-12.18 0-3.25-1.26-6.3-3.55-8.63zm-7.77 18.73c-1.85 0-3.67-.5-5.27-1.44l-.38-.23-3.94 1.05 1.05-3.94-.23-.38c-1.02-1.62-1.56-3.49-1.56-5.41 0-5.6 4.55-10.15 10.15-10.15 2.71 0 5.25 1.05 7.17 2.97 1.92 1.92 2.97 4.46 2.97 7.17 0 5.6-4.55 10.15-10.15 10.15zm5.56-7.59c-.31-.16-1.8-.89-2.08-.99-.27-.11-.47-.16-.67.16-.2.31-.78.99-.96 1.2-.18.2-.36.23-.67.08-.31-.16-1.31-.48-2.49-1.54-.92-.82-1.54-1.84-1.72-2.15-.18-.31-.02-.48.14-.63.14-.14.31-.36.47-.54.16-.18.2-.31.31-.52.11-.2.05-.38-.03-.54-.08-.16-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51-.18-.01-.38-.01-.58-.01-.2 0-.52.08-.79.38-.27.31-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.16.2 2.13 3.25 5.16 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.8-.74 2.05-1.45.25-.72.25-1.33.18-1.45-.08-.12-.27-.2-.58-.35z"/>
                </svg>
                Contact Support
              </a>
            );
          }
        })()}
      </div>
    </div>
  );
}

// Contact Card Component
function ContactCard({
  ownerName,
  userType,
  whatsappLink,
  emailLink,
  propertyStatus,
  listedByType
}: {
  ownerName: string;
  userType?: string;
  whatsappLink: string | null;
  emailLink?: string;
  propertyStatus?: string;
  listedByType?: string;
}) {
  const getUserTypeLabel = (type?: string) => {
    switch(type) {
      case 'agent': return 'Real Estate Agent';
      case 'landlord': return 'Landlord';
      case 'fsbo': return 'Property Owner';
      case 'owner': return 'Property Owner';
      default: return 'Property Contact';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
      
      <div className="mb-6 pb-6 border-b">
        <p className="font-semibold text-gray-900 text-lg">{ownerName}</p>
        <p className="text-sm text-gray-600 mt-1">{getUserTypeLabel(userType)}</p>
      </div>

      {/* Contact Button Logic Based on Property Status */}
      {(() => {
        // Sold properties - no contact
        if (propertyStatus === 'sold') {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 text-sm font-medium text-center">
                🏆 This property has been sold
              </p>
            </div>
          );
        }
        
        // Under contract - backup offers
        if (propertyStatus === 'under_contract') {
          const buttonText = listedByType === 'owner' ? 'Contact Owner (Backup Offers)' : 'Contact Agent (Backup Offers)';
          
          if (whatsappLink) {
            return (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 mb-4"
              >
                <WhatsAppIcon />
                {buttonText}
              </a>
            );
          } else {
            return (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="text-orange-800 text-sm">
                  Property under contract. For backup offers, call +592-762-9797.
                </p>
              </div>
            );
          }
        }
        
        // Active - normal contact
        const buttonText = listedByType === 'owner' ? 'Contact Owner via WhatsApp' : 'Contact via WhatsApp';
        
        if (whatsappLink) {
          return (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 mb-4"
            >
              <WhatsAppIcon />
              {buttonText}
            </a>
          );
        } else {
          return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm">
                Contact information not available. Please call +592-762-9797 for assistance.
              </p>
            </div>
          );
        }
      })()}

      {emailLink && (
        <a
          href={emailLink}
          className="flex items-center justify-center gap-3 w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          Send Email
        </a>
      )}
    </div>
  );
}

// WhatsApp Icon Component
function WhatsAppIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}