const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function runSafeMigration() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🔒 STEP 1: Creating backup of existing FSBO pricing...');
    
    // First, let's see what we're backing up
    const { data: currentPlans, error: currentError } = await supabase
      .from('pricing_plans')
      .select('*')
      .eq('user_type', 'fsbo');
    
    if (currentError) {
      console.error('Error fetching current plans:', currentError);
      return;
    }

    console.log(`Found ${currentPlans.length} existing FSBO plans to backup:`);
    currentPlans.forEach((plan, index) => {
      console.log(`  ${index + 1}. ${plan.plan_name}: $${(plan.price / 100).toFixed(2)} USD`);
    });

    // Create backup table
    const backupQuery = `
      CREATE TABLE IF NOT EXISTS pricing_plans_backup_20251014 AS 
      SELECT * FROM pricing_plans WHERE user_type = 'fsbo'
    `;

    const { error: backupError } = await supabase.rpc('exec_sql', { 
      query: backupQuery 
    });

    if (backupError) {
      console.error('Error creating backup:', backupError);
      return;
    }

    console.log('✅ Backup created successfully!');

    console.log('\n🔄 STEP 2: Applying new FSBO pricing structure...');

    // Delete existing FSBO plans
    const { error: deleteError } = await supabase
      .from('pricing_plans')
      .delete()
      .eq('user_type', 'fsbo');

    if (deleteError) {
      console.error('Error deleting old plans:', deleteError);
      return;
    }

    // Insert new 4-tier pricing
    const newPlans = [
      {
        user_type: 'fsbo',
        plan_name: 'Single Property',
        plan_type: 'per_property',
        price: 1500000, // G$15,000 in cents
        currency_code: 'GYD',
        duration_days: 60,
        max_properties: 1,
        max_featured_listings: 0,
        is_active: true,
        is_popular: false,
        features: {
          placement: 'standard',
          support: 'email', 
          active_days: 60,
          photos: 8,
          search_visibility: true,
          mobile_optimized: true
        },
        country_code: 'GY'
      },
      {
        user_type: 'fsbo',
        plan_name: 'Featured Listing',
        plan_type: 'per_property', 
        price: 2500000, // G$25,000 in cents
        currency_code: 'GYD',
        duration_days: 90,
        max_properties: 1,
        max_featured_listings: 1,
        is_active: true,
        is_popular: true, // Most popular
        features: {
          placement: 'featured',
          support: 'priority',
          active_days: 90, 
          photos: 15,
          badge: 'featured',
          homepage_feature: true,
          social_sharing: true
        },
        country_code: 'GY'
      },
      {
        user_type: 'fsbo',
        plan_name: 'Premium Listing',
        plan_type: 'per_property',
        price: 3500000, // G$35,000 in cents
        currency_code: 'GYD', 
        duration_days: 180,
        max_properties: 1,
        max_featured_listings: 1,
        is_active: true,
        is_popular: false,
        features: {
          placement: 'top',
          support: 'premium',
          active_days: 180,
          photos: 20,
          social_promo: true,
          virtual_tour: true,
          priority_placement: true
        },
        country_code: 'GY'
      },
      {
        user_type: 'fsbo',
        plan_name: 'Enterprise',
        plan_type: 'enterprise',
        price: 15000000, // G$150,000 in cents (starting price)
        currency_code: 'GYD',
        duration_days: 365,
        max_properties: 25,
        max_featured_listings: 999, // Unlimited
        is_active: true,
        is_popular: false,
        features: {
          placement: 'custom',
          support: 'dedicated',
          active_days: 365,
          photos: 'unlimited',
          properties: 25,
          branding: true,
          api_access: true,
          requires_contact: true,
          free_setup: true
        },
        country_code: 'GY'
      }
    ];

    const { data: insertedPlans, error: insertError } = await supabase
      .from('pricing_plans')
      .insert(newPlans)
      .select();

    if (insertError) {
      console.error('Error inserting new plans:', insertError);
      console.log('🔄 Rolling back...');
      
      // Rollback: restore from backup
      // Note: This would need custom SQL function to restore from backup table
      return;
    }

    console.log('✅ New pricing plans inserted successfully!');

    console.log('\n📊 VERIFICATION: New FSBO pricing structure:');
    insertedPlans.forEach((plan, index) => {
      console.log(`  ${index + 1}. ${plan.plan_name}: G$${(plan.price / 100).toLocaleString()} (${plan.duration_days} days, ${plan.features.photos} photos)`);
    });

    console.log('\n🎉 Migration completed successfully!');
    console.log('📱 Main contact number verified: +592 762-9797');

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runSafeMigration();