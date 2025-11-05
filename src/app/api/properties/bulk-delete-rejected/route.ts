import { createClient } from '@/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Starting bulk delete of rejected properties...');
    
    const supabase = createClient();
    
    // Get the current user and verify admin privileges
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Authentication failed for bulk delete');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminUser) {
      console.log('❌ Non-admin user attempted bulk delete:', user.email);
      return NextResponse.json(
        { error: 'Admin privileges required for bulk delete operations' },
        { status: 403 }
      );
    }

    console.log('✅ Admin verified for bulk delete:', user.email);

    // Get count of rejected properties before deletion
    const { count: rejectedCount, error: countError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected');

    if (countError) {
      console.error('❌ Error counting rejected properties:', countError);
      return NextResponse.json(
        { error: 'Failed to count rejected properties' },
        { status: 500 }
      );
    }

    if (rejectedCount === 0) {
      console.log('ℹ️ No rejected properties found to delete');
      return NextResponse.json({
        success: true,
        message: 'No rejected properties found to delete',
        deletedCount: 0
      });
    }

    // Delete all rejected properties and their associated media
    console.log(`🗑️ Deleting ${rejectedCount} rejected properties...`);

    // First, delete associated property media
    const { error: mediaError } = await supabase
      .from('property_media')
      .delete()
      .in('property_id', supabase
        .from('properties')
        .select('id')
        .eq('status', 'rejected')
      );

    if (mediaError) {
      console.warn('⚠️ Error deleting property media (continuing):', mediaError);
      // Continue with property deletion even if media deletion fails
    }

    // Delete all rejected properties
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('status', 'rejected');

    if (deleteError) {
      console.error('❌ Error during bulk delete:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete rejected properties: ' + deleteError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully deleted ${rejectedCount} rejected properties`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${rejectedCount} rejected properties`,
      deletedCount: rejectedCount
    });

  } catch (error) {
    console.error('❌ Bulk delete operation failed:', error);
    return NextResponse.json(
      { error: 'Internal server error during bulk delete' },
      { status: 500 }
    );
  }
}