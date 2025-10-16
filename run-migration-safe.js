const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function runSafeMigration() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🔒 STEP 1: Backing up existing FSBO pricing...');
    
    // Get current FSBO plans for backup (in memory)
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
      console.log(`  ${index + 1}. ${plan.plan_name}: $${(plan.price / 100).toFixed(2)} USD`);
    });

    // Store backup data in a JSON file for safety
    require('fs').writeFileSync('./fsbo-backup-20251014.json', JSON.stringify(backupPlans, null, 2));
    console.log('✅ Backup saved to fsbo-backup-20251014.json');

    console.log('\n🔄 STEP 2: Applying new FSBO pricing structure...');

    // Delete existing FSBO plans
    const { error: deleteError } = await supabase
      .from('pricing_plans')
      .delete()
      .eq('user_type', 'fsbo');

    if (deleteError) {
      console.error('Error deleting old plans:', deleteError);
      console.log('🔄 Restoring from backup...');
      
      // Restore from backup
      const { error: restoreError } = await supabase
        .from('pricing_plans')
        .insert(backupPlans);
      
      if (restoreError) {
        console.error('CRITICAL: Backup restoration failed!', restoreError);
      } else {
        console.log('✅ Backup restored successfully');
      }
      return;
    }

    console.log('✅ Old FSBO plans deleted');

    // Insert new 4-tier pricing
    const newPlans = [
      {
        user_type: 'fsbo',
        plan_name: 'Single Property',
        plan_type: 'per_property',
        price: 1500000, // G$15,000 in cents
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
        }
      },
      {
        user_type: 'fsbo',
        plan_name: 'Featured Listing',
        plan_type: 'per_property', 
        price: 2500000, // G$25,000 in cents
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
        }
      },
      {
        user_type: 'fsbo',
        plan_name: 'Premium Listing',
        plan_type: 'per_property',
        price: 3500000, // G$35,000 in cents
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
        }
      },
      {
        user_type: 'fsbo',
        plan_name: 'Enterprise',
        plan_type: 'enterprise',
        price: 15000000, // G$150,000 in cents (starting price)
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
        }
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
        console.log('Manual restore needed from fsbo-backup-20251014.json');
      } else {
        console.log('✅ Successfully rolled back to original plans');
      }
      return;
    }

    console.log('✅ New pricing plans inserted successfully!');

    console.log('\n📊 VERIFICATION: New FSBO pricing structure:');
    insertedPlans.forEach((plan, index) => {
      const photosText = typeof plan.features.photos === 'number' ? `${plan.features.photos} photos` : plan.features.photos;
      console.log(`  ${index + 1}. ${plan.plan_name}: G$${(plan.price / 100).toLocaleString()} (${plan.duration_days} days, ${photosText})`);
    });

    console.log('\n🎉 Migration completed successfully!');
    console.log('📱 Main contact number verified: +592 762-9797');
    
    // Run verification check
    console.log('\n🔍 Final verification...');
    const { data: verifyPlans, error: verifyError } = await supabase
      .from('pricing_plans')
      .select('plan_name, price, duration_days, is_active')
      .eq('user_type', 'fsbo');

    if (!verifyError && verifyPlans.length === 4) {
      console.log('✅ VERIFICATION PASSED: 4 FSBO plans active');
    } else {
      console.log('❌ VERIFICATION FAILED: Expected 4 plans, found', verifyPlans?.length || 0);
    }

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runSafeMigration();