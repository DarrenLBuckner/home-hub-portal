// src/lib/supabase/sync.ts
import { createClient } from '@supabase/supabase-js'

// Public database client (frontend)
export const createPublicDbClient = () => {
  return createClient(
    'https://jvtqyjukmmnudfbvzxew.supabase.co',
    process.env.PUBLIC_DB_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

// Sync property from agent portal to public database
export async function syncPropertyToPublic(propertyData: Record<string, unknown>) {
  try {
    const publicDb = createPublicDbClient()
    
    // Transform agent portal data for public consumption
    const publicPropertyData = {
      id: propertyData.id,
      title: propertyData.title,
      description: propertyData.description,
      price: propertyData.price,
      property_type: propertyData.property_type,
      listing_type: propertyData.listing_type,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      square_meters: propertyData.square_meters,
      address: propertyData.address,
      city: propertyData.city,
      region: propertyData.region,
      country: propertyData.country || 'Guyana',
      latitude: propertyData.latitude,
      longitude: propertyData.longitude,
      status: 'active', // Only sync active properties
  user_id: propertyData.created_by,
      created_at: propertyData.created_at,
      updated_at: new Date().toISOString()
    }
    
    // Insert or update in public database
    const { data, error } = await publicDb
      .from('properties')
      .upsert(publicPropertyData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
    
    if (error) {
      console.error('Sync to public DB failed:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Property synced to public database:', data)
    return { success: true, data }
    
  } catch (error) {
    console.error('Sync operation failed:', error)
    return { success: false, error: 'Sync operation failed' }
  }
}

// Remove property from public database
export async function removePropertyFromPublic(propertyId: string) {
  try {
    const publicDb = createPublicDbClient()
    
    const { error } = await publicDb
      .from('properties')
      .delete()
      .eq('id', propertyId)
    
    if (error) {
      console.error('Remove from public DB failed:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
    
  } catch (error) {
    console.error('Remove operation failed:', error)
    return { success: false, error: 'Remove operation failed' }
  }
}
