#!/usr/bin/env node
/**
 * Supabase Connection Test Script (No dependencies required)
 * 
 * Run: node scripts/test-supabase.js
 */

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function log(message, type = 'info') {
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
  }[type];
  console.log(`${prefix} ${message}`);
}

function header(message) {
  console.log(`\n${colors.bold}${message}${colors.reset}`);
  console.log('='.repeat(message.length));
}

async function testSupabase() {
  header('LinkRescue Supabase Connection Test');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  log('Checking environment variables...', 'info');
  
  if (!supabaseUrl) {
    log('NEXT_PUBLIC_SUPABASE_URL is not set!', 'error');
    console.log('\nAdd it to your .env file:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    process.exit(1);
  }
  
  if (!supabaseUrl.startsWith('https://')) {
    log('NEXT_PUBLIC_SUPABASE_URL should start with https://', 'error');
    process.exit(1);
  }
  
  log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`, 'success');
  
  if (!supabaseKey) {
    log('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set!', 'error');
    console.log('\nAdd it to your .env file:');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...');
    process.exit(1);
  }
  
  if (!supabaseKey.startsWith('eyJ')) {
    log('NEXT_PUBLIC_SUPABASE_ANON_KEY looks invalid (should start with eyJ)', 'warning');
  }
  
  log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey.substring(0, 20)}... (${supabaseKey.length} chars)`, 'success');
  
  if (!serviceKey) {
    log('SUPABASE_SERVICE_ROLE_KEY is not set (optional for this test)', 'warning');
  } else {
    log(`SUPABASE_SERVICE_ROLE_KEY: ${serviceKey.substring(0, 20)}... (${serviceKey.length} chars)`, 'success');
  }
  
  // Test connection using REST API
  header('Testing Supabase Connection');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/users?select=id&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    
    if (response.status === 200) {
      log('✓ Successfully connected to Supabase REST API', 'success');
    } else if (response.status === 404) {
      log('⚠ Connected but "users" table does not exist', 'warning');
      log('  Run the SQL in SUPABASE_SETUP.md to create tables', 'info');
    } else {
      const error = await response.text();
      log(`✗ Connection error: ${response.status} ${response.statusText}`, 'error');
      log(`  ${error}`, 'info');
      
      if (response.status === 401) {
        log('\nYour anon key is invalid. Check your Supabase project settings.', 'error');
      }
    }
  } catch (error) {
    log(`✗ Connection failed: ${error.message}`, 'error');
    log('  Make sure your Supabase URL is correct and the project is active', 'info');
    process.exit(1);
  }
  
  // Test auth endpoint
  header('Testing Auth Endpoint');
  
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    
    if (response.status === 401 || response.status === 200) {
      log('✓ Auth endpoint is accessible', 'success');
    } else {
      log(`⚠ Auth endpoint returned ${response.status}`, 'warning');
    }
  } catch (error) {
    log(`✗ Auth test failed: ${error.message}`, 'error');
  }
  
  // Check tables
  header('Checking Database Tables');
  
  const tables = [
    'users',
    'sites',
    'scans',
    'scan_issues',
    'organizations',
    'organization_members',
    'revenue_history',
  ];
  
  const missingTables = [];
  
  for (const table of tables) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=0`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });
      
      if (response.status === 404) {
        missingTables.push(table);
        log(`✗ Table "${table}" does not exist`, 'error');
      } else if (response.status === 200 || response.status === 401) {
        log(`✓ Table "${table}" exists`, 'success');
      } else {
        log(`⚠ Table "${table}" has issues: ${response.status}`, 'warning');
      }
    } catch (error) {
      log(`✗ Error checking table "${table}": ${error.message}`, 'error');
      missingTables.push(table);
    }
  }
  
  // Summary
  header('Test Summary');
  
  if (missingTables.length === 0) {
    log('✓ All checks passed! Supabase is configured correctly.', 'success');
    console.log('\nNext steps:');
    console.log('1. Make sure all env vars are set in Vercel');
    console.log('2. Redeploy your app');
    console.log('3. Test the signup flow');
  } else {
    log(`⚠ ${missingTables.length} table(s) are missing`, 'warning');
    console.log('\nTo fix:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy the SQL from SUPABASE_SETUP.md');
    console.log('3. Run it to create missing tables');
    console.log('\nThen redeploy your app.');
  }
}

testSupabase().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
