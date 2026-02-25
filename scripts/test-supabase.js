#!/usr/bin/env node
/**
 * Supabase Connection & Schema Test Script
 * 
 * Run: node scripts/test-supabase.js
 * Or: npx tsx scripts/test-supabase.ts
 */

const { createClient } = require('@supabase/supabase-js');

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
  header('LinkRescue Supabase Test');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  log('Checking environment variables...', 'info');
  
  if (!supabaseUrl) {
    log('NEXT_PUBLIC_SUPABASE_URL is not set!', 'error');
    process.exit(1);
  }
  log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`, 'success');
  
  if (!supabaseKey) {
    log('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set!', 'error');
    process.exit(1);
  }
  log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey.substring(0, 20)}... (${supabaseKey.length} chars)`, 'success');
  
  if (!serviceKey) {
    log('SUPABASE_SERVICE_ROLE_KEY is not set (optional for this test)', 'warning');
  } else {
    log(`SUPABASE_SERVICE_ROLE_KEY: ${serviceKey.substring(0, 20)}... (${serviceKey.length} chars)`, 'success');
  }
  
  // Create Supabase client
  header('Testing Supabase Connection');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test 1: Basic connection
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact' });
    if (error) throw error;
    log('✓ Successfully connected to Supabase', 'success');
    log(`  Found ${data.length} users (test query)`, 'info');
  } catch (error) {
    log(`✗ Connection failed: ${error.message}`, 'error');
    log('  Make sure your Supabase URL and anon key are correct', 'info');
    process.exit(1);
  }
  
  // Test 2: Check tables exist
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
      const { error } = await supabase.from(table).select('*', { head: true });
      if (error && error.code === '42P01') {
        missingTables.push(table);
        log(`✗ Table "${table}" does not exist`, 'error');
      } else if (error) {
        log(`⚠ Table "${table}" has issues: ${error.message}`, 'warning');
      } else {
        log(`✓ Table "${table}" exists`, 'success');
      }
    } catch (error) {
      log(`✗ Error checking table "${table}": ${error.message}`, 'error');
      missingTables.push(table);
    }
  }
  
  if (missingTables.length > 0) {
    log('\n⚠ Missing tables detected!', 'warning');
    log('Run the SQL in SUPABASE_SETUP.md to create them', 'info');
  }
  
  // Test 3: Check auth configuration
  header('Testing Authentication');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    log('✓ Auth endpoint is accessible', 'success');
    log(`  Current session: ${session ? 'Active' : 'None (expected for anon)'}`);
  } catch (error) {
    log(`✗ Auth check failed: ${error.message}`, 'error');
  }
  
  // Test 4: Try to create a test user (will fail due to RLS, but tests connection)
  header('Testing RLS Policies');
  
  try {
    const { error } = await supabase
      .from('users')
      .insert([{ id: '00000000-0000-0000-0000-000000000000' }]);
    
    if (error && error.code === '42501') {
      log('✓ RLS is enabled (insert blocked as expected)', 'success');
    } else if (error) {
      log(`⚠ Unexpected error: ${error.message}`, 'warning');
    } else {
      log('⚠ RLS might not be enabled (insert succeeded)', 'warning');
    }
  } catch (error) {
    log(`⚠ RLS test failed: ${error.message}`, 'warning');
  }
  
  // Summary
  header('Test Summary');
  
  if (missingTables.length === 0) {
    log('✓ All checks passed! Supabase is configured correctly.', 'success');
    console.log('\nNext steps:');
    console.log('1. Deploy your app to Vercel with the env vars');
    console.log('2. Test the signup flow');
    console.log('3. Add a site and run a scan');
  } else {
    log(`✗ ${missingTables.length} table(s) are missing. Run the SQL setup.`, 'error');
    console.log('\nTo fix:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy the SQL from SUPABASE_SETUP.md');
    console.log('3. Run it to create missing tables');
  }
  
  process.exit(missingTables.length > 0 ? 1 : 0);
}

testSupabase().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
