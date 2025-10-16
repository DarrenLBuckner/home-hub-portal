const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function runCorrectMigration() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🔒 STEP 1: Backing up existing FSBO pricing...');
    
    // Get current FSBO plans for backup
    const { data: backupPlans, error: backupError } = await supabase
      .from('pricing_plans')
      .select('*')
      .eq('user_type', 'fsbo');
    
    if (backupError) {
      console.error('Error fetching plans for backup:', backupError);
      return;
    }

    console.log(`✅ Backed up ${backupPlans.length} existing FSBO plans:`);
    backupPlans.forEach((plan, index) => {
      console.log(`  ${index + 1}. ${plan.plan_name}: $${(plan.price / 100).toFixed(2)} USD (${plan.listing_duration_days} days)`);
    });

    // Store backup data
    require('fs').writeFileSync('./fsbo-backup-final-20251014.json', JSON.stringify(backupPlans, null, 2));
    console.log('✅ Backup saved to fsbo-backup-final-20251014.json');

    console.log('\n🔄 STEP 2: Applying new FSBO pricing structure with correct schema...');

    // Delete existing FSBO plans
    const { error: deleteError } = await supabase
      .from('pricing_plans')
      .delete()
      .eq('user_type', 'fsbo');

    if (deleteError) {
      console.error('Error deleting old plans:', deleteError);
      return;
    }

    // Insert new 4-tier pricing with correct column names
    const newPlans = [
      {
        plan_name: 'Single Property',
        user_type: 'fsbo',
        plan_type: 'per_property',
        price: 1500000, // G$15,000 in cents
        original_price: null,
        max_properties: 1,
        featured_listings_included: 0,
        listing_duration_days: 60,
        features: {
          placement: 'standard',
          support: 'email', 
          active_days: 60,
          photos: 8,
          search_visibility: true,
          mobile_optimized: true,
          currency: 'GYD'
        },
        is_active: true,
        is_popular: false,
        display_order: 1
      },
      {
        plan_name: 'Featured Listing',
        user_type: 'fsbo',
        plan_type: 'per_property',
        price: 2500000, // G$25,000 in cents
        original_price: null,
        max_properties: 1,
        featured_listings_included: 1,
        listing_duration_days: 90,
        features: {
          placement: 'featured',
          support: 'priority',
          active_days: 90, 
          photos: 15,
          badge: 'featured',
          homepage_feature: true,
          social_sharing: true,
          currency: 'GYD'
        },
        is_active: true,
        is_popular: true, // Most popular
        display_order: 2
      },
      {
        plan_name: 'Premium Listing',
        user_type: 'fsbo',
        plan_type: 'per_property',
        price: 3500000, // G$35,000 in cents
        original_price: null,
        max_properties: 1,
        featured_listings_included: 1,
        listing_duration_days: 180,
        features: {
          placement: 'top',
          support: 'premium',
          active_days: 180,
          photos: 20,
          social_promo: true,
          virtual_tour: true,
          priority_placement: true,
          currency: 'GYD'
        },
        is_active: true,
        is_popular: false,
        display_order: 3
      },
      {
        plan_name: 'Enterprise',
        user_type: 'fsbo',
        plan_type: 'enterprise',
        price: 15000000, // G$150,000 in cents (starting price)
        original_price: null,
        max_properties: 25,
        featured_listings_included: 999, // Unlimited
        listing_duration_days: 365,
        features: {
          placement: 'custom',
          support: 'dedicated',
          active_days: 365,
          photos: 'unlimited',
          properties: 25,
          branding: true,
          api_access: true,
          requires_contact: true,
          free_setup: true,
          currency: 'GYD'
        },
        is_active: true,
        is_popular: false,
        display_order: 4
      }
    ];

    const { data: insertedPlans, error: insertError } = await supabase
      .from('pricing_plans')
      .insert(newPlans)
      .select();

    if (insertError) {
      console.error('Error inserting new plans:', insertError);
      console.log('🔄 Rolling back to original plans...');
      
      // Rollback: restore original plans
      const { error: rollbackError } = await supabase
        .from('pricing_plans')
        .insert(backupPlans);
      
      if (rollbackError) {
        console.error('CRITICAL: Rollback failed!', rollbackError);
      } else {
        console.log('✅ Successfully rolled back to original plans');
      }
      return;
    }

    console.log('✅ New pricing plans inserted successfully!');

    console.log('\n📊 NEW FSBO PRICING STRUCTURE:');
    insertedPlans.forEach((plan, index) => {
      const photosText = typeof plan.features.photos === 'number' ? `${plan.features.photos} photos` : plan.features.photos;
      const priceGYD = (plan.price / 100).toLocaleString();
      console.log(`  ${index + 1}. ${plan.plan_name}: G$${priceGYD} (${plan.listing_duration_days} days, ${photosText})`);
    });

    console.log('\n🎉 FSBO Pricing Migration Completed Successfully!');
    console.log('📱 Main contact number: +592 762-9797');
    
    // Final verification
    const { data: verifyPlans, error: verifyError } = await supabase
      .from('pricing_plans')
      .select('plan_name, price, listing_duration_days, is_active')
      .eq('user_type', 'fsbo')
      .eq('is_active', true);

    console.log(`\n✅ VERIFICATION: ${verifyPlans?.length || 0}/4 FSBO plans active`);
    
    if (verifyPlans?.length === 4) {
      console.log('🎯 Ready to update frontend component!');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runCorrectMigration();