'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import QRCode from 'qrcode';

interface Agent {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_image: string | null;
  company: string | null;
  is_founding_member: boolean;
  is_verified_agent: boolean;
  active_listing_count: number;
  years_experience: number | null;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number | null;
  city: string;
  region: string;
  listing_type: string;
  image: string | null;
}

interface Vetting {
  bio: string | null;
  specialties: string[] | null;
  target_region: string | null;
}

interface AgentProfileClientProps {
  agent: Agent;
  listings: Listing[];
  vetting: Vetting | null;
  slug: string;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatPrice(price: number, currency: string) {
  const symbol = currency === 'USD' ? '$' : currency === 'GYD' ? 'GY$' : currency;
  return `${symbol}${price.toLocaleString()}`;
}

function cleanPhone(phone: string) {
  return phone.replace(/[^0-9+]/g, '');
}

export default function AgentProfileClient({ agent, listings, vetting, slug }: AgentProfileClientProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const profileUrl = `https://guyanahomehub.com/agents/${slug}`;

  useEffect(() => {
    QRCode.toDataURL(profileUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#059669', light: '#ffffff' },
    }).then(setQrDataUrl);
  }, [profileUrl]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${agent.full_name} | Guyana HomeHub`, url: profileUrl });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappLink = agent.phone ? `https://wa.me/${cleanPhone(agent.phone)}` : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            {/* Profile Image */}
            <div className="shrink-0">
              {agent.profile_image ? (
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden ring-4 ring-emerald-600 shadow-xl">
                  <Image
                    src={agent.profile_image}
                    alt={agent.full_name}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              ) : (
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-emerald-600 flex items-center justify-center ring-4 ring-emerald-500 shadow-xl">
                  <span className="text-4xl sm:text-5xl font-bold text-white">
                    {getInitials(agent.full_name)}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">{agent.full_name}</h1>
              {agent.company && (
                <p className="text-gray-300 text-lg mb-3">{agent.company}</p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-6">
                {agent.is_founding_member && (
                  <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-sm font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    Founding Member
                  </span>
                )}
                {agent.is_verified_agent && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-sm font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Verified Agent
                  </span>
                )}
              </div>

              {/* Contact Buttons */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    WhatsApp
                  </a>
                )}
                {agent.phone && (
                  <a
                    href={`tel:${cleanPhone(agent.phone)}`}
                    className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    Call
                  </a>
                )}
                {agent.email && (
                  <a
                    href={`mailto:${agent.email}`}
                    className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Email
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{agent.active_listing_count}</p>
              <p className="text-sm text-gray-500">Active Listings</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600">
                {agent.years_experience ? `${agent.years_experience}+` : '—'}
              </p>
              <p className="text-sm text-gray-500">Years Experience</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600">
                {agent.is_founding_member ? 'Yes' : '—'}
              </p>
              <p className="text-sm text-gray-500">Founding Member</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Bio */}
        {vetting?.bio && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">About</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{vetting.bio}</p>
          </section>
        )}

        {/* Specialties & Areas */}
        {(vetting?.specialties?.length || vetting?.target_region) && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Specialties & Areas</h2>
            <div className="flex flex-wrap gap-2">
              {vetting?.specialties?.map((s) => (
                <span key={s} className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                  {s}
                </span>
              ))}
              {vetting?.target_region && (
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                  {vetting.target_region}
                </span>
              )}
            </div>
          </section>
        )}

        {/* Listings Grid */}
        {listings.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Active Listings ({listings.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/properties/${listing.id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden group"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gray-200">
                    {listing.image ? (
                      <Image
                        src={listing.image}
                        alt={listing.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 22V12h6v10" /></svg>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="bg-emerald-600 text-white px-2 py-1 rounded text-xs font-medium">
                        {listing.listing_type === 'rent' ? 'For Rent' : listing.listing_type === 'lease' ? 'For Lease' : 'For Sale'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{listing.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {listing.city}{listing.region ? `, ${listing.region}` : ''}
                    </p>
                    <p className="text-lg font-bold text-emerald-600 mb-2">
                      {formatPrice(listing.price, listing.currency)}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      {listing.bedrooms != null && <span>{listing.bedrooms} bed</span>}
                      {listing.bathrooms != null && <span>{listing.bathrooms} bath</span>}
                      {listing.area_sqft != null && <span>{listing.area_sqft.toLocaleString()} sqft</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* QR Code & Share */}
        <section className="flex flex-col sm:flex-row items-center gap-6 bg-white rounded-lg shadow-md p-6">
          {qrDataUrl && (
            <div className="shrink-0">
              <img src={qrDataUrl} alt="QR Code" className="w-36 h-36" />
            </div>
          )}
          <div className="text-center sm:text-left flex-1">
            <h3 className="font-bold text-gray-900 mb-1">Share this profile</h3>
            <p className="text-sm text-gray-500 mb-3">Scan the QR code or copy the link to share {agent.full_name}&apos;s profile.</p>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              {copied ? 'Link Copied!' : 'Share Profile'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
