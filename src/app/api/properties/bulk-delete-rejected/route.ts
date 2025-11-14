import { createAdminClient } from '@/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    
    const supabase = createAdminClient();
    
    // Admin client doesn't need user auth verification - it has full access

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

    // First, get the IDs of rejected properties
    const { data: rejectedProperties, error: idsError } = await supabase
      .from('properties')
      .select('id')
      .eq('status', 'rejected');

    if (idsError) {
      console.error('❌ Error fetching rejected property IDs:', idsError);
      return NextResponse.json(
        { error: 'Failed to fetch rejected property IDs' },
        { status: 500 }
      );
    }

    const propertyIds = (rejectedProperties as { id: string }[])?.map(p => p.id) || [];

    // Delete associated property media if there are any rejected properties
    if (propertyIds.length > 0) {
      const { error: mediaError } = await supabase
        .from('property_media')
        .delete()
        .in('property_id', propertyIds);

      if (mediaError) {
        console.warn('⚠️ Error deleting property media (continuing):', mediaError);
        // Continue with property deletion even if media deletion fails
      }
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