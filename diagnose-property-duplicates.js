const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://opjnizbtppkynxzssijy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wam5pemJ0cHBreW54enNzaWp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTI5Mjc0OSwiZXhwIjoyMDQ0ODY4NzQ5fQ.YVco3bSKgfLQcEyuNlnKhCbTH2sTBt5bJnxl6cNqhWY'; // service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseDuplicateProperties() {
  console.log('🔍 PROPERTY DUPLICATION DIAGNOSTIC');
  console.log('=====================================\n');

  try {
    // 1. Check for duplicate IDs
    console.log('1. Checking for duplicate property IDs...');
    const { data: allProperties, error: allError } = await supabase
      .from('properties')
      .select('id, title, price, created_at, user_id')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Error fetching all properties:', allError);
      return;
    }

    console.log(`📊 Total properties in database: ${allProperties.length}`);

    // Check for duplicate IDs
    const idCounts = {};
    allProperties.forEach(prop => {
      idCounts[prop.id] = (idCounts[prop.id] || 0) + 1;
    });

    const duplicateIds = Object.entries(idCounts).filter(([id, count]) => count > 1);
    
    if (duplicateIds.length > 0) {
      console.log('\n🚨 FOUND DUPLICATE PROPERTY IDs:');
      duplicateIds.forEach(([id, count]) => {
        console.log(`  - ID: ${id} appears ${count} times`);
        const dupes = allProperties.filter(p => p.id === id);
        dupes.forEach((prop, idx) => {
          console.log(`    ${idx + 1}. "${prop.title}" - $${prop.price} - Created: ${prop.created_at}`);
        });
      });
    } else {
      console.log('✅ No duplicate property IDs found');
    }

    // 2. Check for similar titles with same user (potential accidental duplicates)
    console.log('\n2. Checking for properties with identical titles by same user...');
    const titleUserCombos = {};
    allProperties.forEach(prop => {
      const key = `${prop.title.toLowerCase().trim()}_${prop.user_id}`;
      if (!titleUserCombos[key]) {
        titleUserCombos[key] = [];
      }
      titleUserCombos[key].push(prop);
    });

    const duplicateTitles = Object.entries(titleUserCombos).filter(([key, props]) => props.length > 1);
    
    if (duplicateTitles.length > 0) {
      console.log('\n🔄 FOUND PROPERTIES WITH SAME TITLE BY SAME USER:');
      duplicateTitles.forEach(([key, props]) => {
        const [title, userId] = key.split('_');
        console.log(`\n  Title: "${props[0].title}" (User: ${userId})`);
        props.forEach((prop, idx) => {
          console.log(`    ${idx + 1}. ID: ${prop.id} - $${prop.price} - Created: ${prop.created_at}`);
        });
      });
    } else {
      console.log('✅ No duplicate titles by same user found');
    }

    // 3. Check the specific property ID from the error
    const problemId = '0c710754-d280-4213-86d1-07871894ad0c';
    console.log(`\n3. Checking specific property ID from error: ${problemId}...`);
    
    const { data: specificProps, error: specificError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', problemId);

    if (specificError) {
      console.error('❌ Error fetching specific property:', specificError);
    } else {
      console.log(`📋 Found ${specificProps.length} properties with ID ${problemId}:`);
      specificProps.forEach((prop, idx) => {
        console.log(`  ${idx + 1}. "${prop.title}" - $${prop.price} - Status: ${prop.status} - Created: ${prop.created_at}`);
      });
    }

    // 4. Check recent properties created today
    console.log('\n4. Checking properties created today...');
    const today = new Date().toISOString().split('T')[0];
    const { data: todayProps, error: todayError } = await supabase
      .from('properties')
      .select('id, title, price, status, created_at, user_id')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .order('created_at', { ascending: false });

    if (todayError) {
      console.error('❌ Error fetching today\'s properties:', todayError);
    } else {
      console.log(`📅 Properties created today: ${todayProps.length}`);
      todayProps.forEach((prop, idx) => {
        console.log(`  ${idx + 1}. "${prop.title}" - $${prop.price} - Status: ${prop.status} - ID: ${prop.id}`);
      });
    }

    // 5. Check for properties with Qumar as owner
    console.log('\n5. Checking properties by Qumar...');
    const { data: qumarUser, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .ilike('email', '%qumar%')
      .single();

    if (userError) {
      console.log('⚠️ Could not find Qumar user:', userError.message);
    } else {
      console.log(`👤 Found Qumar: ${qumarUser.full_name} (${qumarUser.email})`);
      
      const { data: qumarProps, error: qumarPropsError } = await supabase
        .from('properties')
        .select('id, title, price, status, created_at')
        .eq('user_id', qumarUser.id)
        .order('created_at', { ascending: false });

      if (qumarPropsError) {
        console.error('❌ Error fetching Qumar properties:', qumarPropsError);
      } else {
        console.log(`🏠 Qumar's properties: ${qumarProps.length}`);
        qumarProps.forEach((prop, idx) => {
          console.log(`  ${idx + 1}. "${prop.title}" - $${prop.price} - Status: ${prop.status} - ID: ${prop.id}`);
        });
      }
    }

  } catch (error) {
    console.error('💥 Diagnostic failed:', error);
  }
}

diagnoseDuplicateProperties();