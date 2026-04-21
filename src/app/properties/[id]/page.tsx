import { createAdminClient } from '@/supabase-admin';
import { notFound } from 'next/navigation';
import PropertyDetailClient from '@/components/PropertyDetailClient';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PropertyDetailPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = createAdminClient();
  const isUuid = UUID_REGEX.test(params.id);

  const selectClause = `
      *,
      owner:profiles!properties_user_id_fkey (
        id,
        first_name,
        last_name,
        phone,
        email,
        user_type
      ),
      property_media!property_media_property_id_fkey (
        media_url,
        media_type,
        display_order,
        is_primary
      )
    `;
  const statuses = ['active', 'under_contract', 'off_market', 'sold', 'rented'];

  // Branch on shape so Supabase column-types narrow correctly (variable-column
  // .eq() loses schema inference and collapses the row type to `never`).
  const { data: property, error } = isUuid
    ? await supabase.from('properties').select(selectClause).eq('id', params.id).in('status', statuses).single()
    : await supabase.from('properties').select(selectClause).eq('slug', params.id).in('status', statuses).single();

  if (error || !property) {
    notFound();
  }

  // Transform the data to include images properly
  const images = property.property_media
    ?.filter((media: any) => media.media_type === 'image')
    ?.sort((a: any, b: any) => {
      // Primary images first, then by display_order
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return a.display_order - b.display_order;
    })
    ?.map((media: any) => media.media_url) || [];

  const transformedProperty = {
    ...property,
    images,
    property_media: undefined // Remove the nested object
  };

  return <PropertyDetailClient property={transformedProperty} />;
}

// SEO metadata
export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const isUuid = UUID_REGEX.test(params.id);

  const selectClause = 'title, description, price, city, listing_type, currency';
  const { data: property } = isUuid
    ? await supabase.from('properties').select(selectClause).eq('id', params.id).single()
    : await supabase.from('properties').select(selectClause).eq('slug', params.id).single();

  if (!property) {
    return {
      title: 'Property Not Found - Guyana Home Hub',
    };
  }

  const listingTypeText = property.listing_type === 'rent' ? 'For Rent' : property.listing_type === 'lease' ? 'For Lease' : 'For Sale';
  const currencySymbol = property.currency === 'USD' ? '$' : property.currency === 'GYD' ? 'GY$' : property.currency;
  const priceText = property.price ? `${currencySymbol}${property.price.toLocaleString()}` : '';
  
  return {
    title: `${property.title} - ${listingTypeText} | Guyana Home Hub`,
    description: property.description?.substring(0, 160) || 
                 `${property.title} in ${property.city || 'Guyana'} - ${listingTypeText} ${priceText}`,
    openGraph: {
      title: `${property.title} - ${listingTypeText}`,
      description: property.description?.substring(0, 160) || `Property ${listingTypeText} in ${property.city || 'Guyana'}`,
      type: 'website',
    },
  };
}