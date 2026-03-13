import { createAdminClient } from '@/supabase-admin';
import { notFound } from 'next/navigation';
import AgentProfileClient from './AgentProfileClient';
import type { Metadata } from 'next';

// premier_agents is a Supabase view not in generated types
interface PremierAgent {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_image: string | null;
  company: string | null;
  slug: string;
  is_founding_member: boolean;
  is_verified_agent: boolean;
  active_listing_count: number;
  years_experience: number | null;
}

interface AgentPageProps {
  params: Promise<{ slug: string }>;
}

async function getAgent(slug: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('premier_agents' as any)
    .select('*')
    .eq('slug', slug)
    .single();

  const agent = data as unknown as PremierAgent | null;
  if (error || !agent) return null;

  // Fetch active listings for this agent
  const { data: listings } = await supabase
    .from('properties')
    .select(`
      id, title, price, currency, bedrooms, bathrooms, area_sqft,
      city, region, listing_type, status,
      property_media!property_media_property_id_fkey (
        media_url, media_type, display_order, is_primary
      )
    `)
    .eq('user_id', agent.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  // Fetch bio/specialties from agent_vetting
  const { data: vetting } = await supabase
    .from('agent_vetting' as any)
    .select('bio, specialties, target_region')
    .eq('user_id', agent.id)
    .single();

  return { agent, listings: listings || [], vetting: vetting as any };
}

export async function generateMetadata({ params }: AgentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getAgent(slug);

  if (!result) {
    return { title: 'Agent Not Found | Guyana HomeHub' };
  }

  const { agent } = result;
  const description = `${agent.full_name} has ${agent.active_listing_count || 0} active listings in Guyana. Contact directly on Guyana HomeHub.`;

  return {
    title: `${agent.full_name} | Premier Agent | Guyana HomeHub`,
    description,
    openGraph: {
      title: `${agent.full_name} | Premier Agent | Guyana HomeHub`,
      description,
      type: 'profile',
      ...(agent.profile_image ? { images: [{ url: agent.profile_image }] } : {}),
    },
  };
}

export default async function AgentProfilePage({ params }: AgentPageProps) {
  const { slug } = await params;
  const result = await getAgent(slug);

  if (!result) {
    notFound();
  }

  const { agent, listings, vetting } = result;

  // Transform listings to include primary image
  const transformedListings = listings.map((listing: any) => {
    const images = listing.property_media
      ?.filter((m: any) => m.media_type === 'image')
      ?.sort((a: any, b: any) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return a.display_order - b.display_order;
      })
      ?.map((m: any) => m.media_url) || [];

    return {
      id: listing.id,
      title: listing.title,
      price: listing.price,
      currency: listing.currency,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      area_sqft: listing.area_sqft,
      city: listing.city,
      region: listing.region,
      listing_type: listing.listing_type,
      image: images[0] || null,
    };
  });

  return (
    <AgentProfileClient
      agent={agent}
      listings={transformedListings}
      vetting={vetting}
      slug={slug}
    />
  );
}
