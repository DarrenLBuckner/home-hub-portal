const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkPaymentAndQuotas() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('🔍 Checking payment_history table...');
    
    // Check if payment_history table exists and its structure
    const { data: payments, error: paymentError } = await supabase
      .from('payment_history')
      .select('*')
      .limit(5);
    
    if (paymentError) {
      console.log('❌ payment_history table does not exist or error:', paymentError.message);
    } else {
      console.log(`✅ payment_history table exists with ${payments.length} records`);
      if (payments.length > 0) {
        console.log('Sample payment record:', payments[0]);
      }
    }

    console.log('\n🔍 Checking property_quotas table...');
    
    // Check if property_quotas table exists
    const { data: quotas, error: quotaError } = await supabase
      .from('property_quotas')
      .select('*');
    
    if (quotaError) {
      console.log('❌ property_quotas table does not exist or error:', quotaError.message);
    } else {
      console.log(`✅ property_quotas table exists with ${quotas.length} records`);
      console.log('User quotas:', quotas);
    }

    console.log('\n🔍 Checking user distribution...');
    
    // Check user types distribution
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .not('user_type', 'is', null);
    
    if (!profileError) {
      const userTypeCount = {};
      profiles.forEach(profile => {
        userTypeCount[profile.user_type] = (userTypeCount[profile.user_type] || 0) + 1;
      });
      console.log('User type distribution:', userTypeCount);
    }

    console.log('\n✅ Payment and quota audit completed');

  } catch (error) {
    console.error('Error during audit:', error);
  }
}

checkPaymentAndQuotas();