import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verifyDatabase() {
  console.log('🔍 Verifying Database Schema...\n');

  const tables = [
    'profiles',
    'courts',
    'coaches',
    'equipment',
    'pricing_rules',
    'bookings',
    'waitlist'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(1);

      if (error) {
        console.log(`❌ Table '${table}': ERROR - ${error.message}`);
      } else {
        console.log(`✅ Table '${table}': OK (${count || 0} rows)`);
      }
    } catch (err) {
      console.log(`❌ Table '${table}': EXCEPTION - ${err.message}`);
    }
  }

  console.log('\n🔍 Checking RPC Functions...\n');

  const rpcFunctions = [
    'check_booking_availability',
    'join_waitlist',
    'get_waitlist_position',
    'cancel_booking_with_waitlist'
  ];

  for (const func of rpcFunctions) {
    try {
      // Just check if function exists by calling with dummy params
      const { error } = await supabase.rpc(func, {}).limit(0);
      
      if (error && error.message.includes('function')) {
        console.log(`❌ RPC '${func}': NOT FOUND`);
      } else {
        console.log(`✅ RPC '${func}': EXISTS`);
      }
    } catch (err) {
      console.log(`⚠️  RPC '${func}': ${err.message}`);
    }
  }

  console.log('\n🔍 Checking Seed Data...\n');

  // Check equipment
  const { data: equipment } = await supabase
    .from('equipment')
    .select('*');
  console.log(`Equipment: ${equipment?.length || 0} items`);
  if (equipment) {
    equipment.forEach(e => {
      console.log(`  - ${e.type}: ${e.total_stock} total, $${e.rental_price} rental`);
    });
  }

  // Check pricing rules
  const { data: rules } = await supabase
    .from('pricing_rules')
    .select('*');
  console.log(`\nPricing Rules: ${rules?.length || 0} rules`);
  if (rules) {
    rules.forEach(r => {
      console.log(`  - ${r.name} (${r.rule_type}): ${r.multiplier}x multiplier, $${r.surcharge} surcharge`);
    });
  }

  console.log('\n✨ Database verification complete!\n');
}

verifyDatabase().catch(console.error);
