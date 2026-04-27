import { supabase } from './src/lib/supabase';

async function debugStats() {
  const code = 'jergus';
  
  // 1. Get profile stats
  const { data: profile } = await supabase
    .from('referral_profiles')
    .select('total_clicks, referral_code')
    .eq('referral_code', code)
    .single();
    
  console.log('Profile Counter:', profile?.total_clicks);
  
  // 2. Count actual rows
  const { count, error } = await supabase
    .from('referral_clicks')
    .select('*', { count: 'exact', head: true })
    .eq('referral_code', code);
    
  console.log('Actual Rows in referral_clicks:', count);
  
  if (error) console.error('Error counting rows:', error);
}

debugStats();
