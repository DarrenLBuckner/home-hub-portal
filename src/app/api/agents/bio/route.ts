export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';

export async function POST(request: Request) {
  try {
    // Use untyped client since agent_vetting isn't in generated types
    const supabase: any = createAdminClient();

    // Get the auth header to identify the agent
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { questionnaire_answers, generated_bio } = body;

    if (!questionnaire_answers) {
      return NextResponse.json({ error: 'Missing questionnaire answers' }, { status: 400 });
    }

    // Update agent_vetting with questionnaire answers and generated bio
    const updateData: Record<string, unknown> = {
      bio_questionnaire: questionnaire_answers,
      bio_questionnaire_completed_at: new Date().toISOString(),
    };

    // If a generated bio was approved, save it
    if (generated_bio) {
      updateData.bio = generated_bio;
    }

    const { error: updateError } = await supabase
      .from('agent_vetting')
      .update(updateData)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Bio save error:', updateError);
      return NextResponse.json({ error: 'Failed to save bio data: ' + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Bio saved successfully' });
  } catch (error: any) {
    console.error('Bio save error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to check if agent has completed bio questionnaire
export async function GET(request: Request) {
  try {
    const supabase: any = createAdminClient();

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: vetting } = await supabase
      .from('agent_vetting')
      .select('bio, bio_questionnaire, bio_questionnaire_completed_at')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      has_bio: !!vetting?.bio,
      has_completed_questionnaire: !!vetting?.bio_questionnaire_completed_at,
      questionnaire_answers: vetting?.bio_questionnaire || null,
      bio: vetting?.bio || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
