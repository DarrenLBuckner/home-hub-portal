import { NextRequest, NextResponse } from 'next/server';
import { supabaseBackend } from '@/lib/supabase-backend';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Admin Advertiser Approval API
 * POST /api/admin/advertising/advertisers/[id]/approve - Approve an advertiser
 */

async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    return {
      user,
      userType: profile?.user_type
    };
  } catch {
    return null;
  }
}

function isAuthorizedAdmin(userType: string | null) {
  return userType && ['admin', 'superadmin', 'owner'].includes(userType);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth || !isAuthorizedAdmin(auth.userType)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const advertiserId = params.id;

    // First, check if advertiser exists
    const { data: existingAdvertiser, error: checkError } = await supabaseBackend
      .from('advertisers')
      .select('id, company_name, status')
      .eq('id', advertiserId)
      .single();

    if (checkError || !existingAdvertiser) {
      return NextResponse.json(
        { error: 'Advertiser not found' },
        { status: 404 }
      );
    }

    if (existingAdvertiser.status === 'approved' || existingAdvertiser.status === 'active') {
      return NextResponse.json(
        { error: 'Advertiser is already approved' },
        { status: 400 }
      );
    }

    // Approve the advertiser
    const { data: updatedAdvertiser, error: updateError } = await supabaseBackend
      .from('advertisers')
      .update({
        status: 'approved',
        is_verified: true,
        approved_at: new Date().toISOString(),
        approved_by: auth.user.id
      })
      .eq('id', advertiserId)
      .select()
      .single();

    if (updateError) {
      console.error('Error approving advertiser:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve advertiser' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      advertiser: updatedAdvertiser,
      message: 'Advertiser approved successfully'
    });

  } catch (error) {
    console.error('Error in advertiser approval API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}