const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserManagementSystem() {
  console.log('🔍 Checking user management system...\n');
  
  // Check if there's a users table
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(3);
    
    if (!usersError && users) {
      console.log('👥 USERS table found:', users.length, 'records');
      if (users.length > 0) {
        console.log('User table columns:', Object.keys(users[0]).join(', '));
        console.log('Sample user:', JSON.stringify(users[0], null, 2));
      }
    } else {
      console.log('No users table or error:', usersError?.message);
    }
  } catch (e) {
    console.log('Users table check failed:', e.message);
  }

  // Check if there's an agents table
  try {
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .limit(3);
    
    if (!agentsError && agents) {
      console.log('\n👔 AGENTS table found:', agents.length, 'records');
      if (agents.length > 0) {
        console.log('Agent table columns:', Object.keys(agents[0]).join(', '));
        console.log('Sample agent:', JSON.stringify(agents[0], null, 2));
      }
    } else {
      console.log('No agents table or error:', agentsError?.message);
    }
  } catch (e) {
    console.log('Agents table check failed:', e.message);
  }

  // Check existing properties to see what user_id pattern is used
  const { data: properties, error: propError } = await supabase
    .from('properties')
    .select('id, user_id, title, status')
    .limit(5);
    
  if (properties && properties.length > 0) {
    console.log('\n🏠 PROPERTIES user_id analysis:');
    properties.forEach(p => {
      console.log(`- Property: ${p.title}`);
      console.log(`  user_id: ${p.user_id}`);
      console.log(`  status: ${p.status}`);
      console.log('');
    });
  }

  // Check if there are franchise applications or agent signup records
  try {
    const { data: franchises, error: franchiseError } = await supabase
      .from('franchise_applications')
      .select('*')
      .limit(3);
    
    if (!franchiseError && franchises) {
      console.log('\n🏢 FRANCHISE_APPLICATIONS table found:', franchises.length, 'records');
      if (franchises.length > 0) {
        console.log('Franchise table columns:', Object.keys(franchises[0]).join(', '));
      }
    }
  } catch (e) {
    console.log('No franchise_applications table');
  }
}

checkUserManagementSystem().then(() => {
  console.log('\n✅ User management system analysis complete');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});