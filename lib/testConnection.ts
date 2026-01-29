import { supabase } from './supabase';

/**
 * Test Supabase connection and table existence
 */
export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  console.log('📡 Supabase URL:', supabase.supabaseUrl);
  
  try {
    // Test 0: Check basic connectivity
    console.log('Test 0: Checking network connectivity...');
    const startTime = Date.now();
    
    // Test 1: Check if we can connect to Supabase
    console.log('Test 1: Connecting to Supabase...');
    const { data, error } = await supabase.from('match_offers').select('count');
    
    const endTime = Date.now();
    console.log(`⏱️ Request took ${endTime - startTime}ms`);
    
    if (error) {
      console.error('❌ Connection test failed:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      return {
        success: false,
        error: error.message,
        hint: error.hint || error.code === 'PGRST301' 
          ? 'Tables exist but might have permission issues. Check RLS policies.'
          : error.message.includes('Failed to fetch') || error.message.includes('Network')
          ? 'Cannot reach Supabase. Check your URL in lib/supabase.ts'
          : 'Check if tables exist in Supabase'
      };
    }
    
    console.log('✅ Connection successful!');
    console.log('✅ match_offers table exists');
    
    // Test 2: Check other tables
    const tables = ['slots', 'approvals', 'notifications'];
    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('count').limit(1);
      if (tableError) {
        console.error(`❌ Table ${table} not found:`, tableError.message);
        return {
          success: false,
          error: `Table ${table} does not exist`,
          hint: 'Run the full_migration.sql script in Supabase'
        };
      }
      console.log(`✅ ${table} table exists`);
    }
    
    return {
      success: true,
      message: 'All tables exist and connection is working!'
    };
    
  } catch (err: any) {
    console.error('❌ Unexpected error:', err);
    return {
      success: false,
      error: err.message,
      hint: 'Check your Supabase URL and API key in lib/supabase.ts'
    };
  }
}
