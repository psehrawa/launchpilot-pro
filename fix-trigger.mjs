import pg from 'pg';
const { Client } = pg;

// Direct connection to Supabase Postgres
const client = new Client({
  host: 'aws-0-us-west-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.gsfcbutafdkeizwmtskt',
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Check existing triggers
    const triggers = await client.query(`
      SELECT tgname, tgrelid::regclass as table_name 
      FROM pg_trigger 
      WHERE tgrelid = 'auth.users'::regclass
    `);
    console.log('Existing triggers on auth.users:', triggers.rows);
    
    // Drop triggers
    console.log('Dropping triggers...');
    await client.query('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users');
    await client.query('DROP FUNCTION IF EXISTS handle_new_lp_user() CASCADE');
    await client.query('DROP FUNCTION IF EXISTS handle_new_user() CASCADE');
    
    // Verify
    const after = await client.query(`
      SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass
    `);
    console.log('Triggers after cleanup:', after.rows);
    
    // Test user creation
    console.log('Testing user creation...');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
