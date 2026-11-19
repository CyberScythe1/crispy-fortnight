import pg from 'pg';
const { Client } = pg;

const conn = 'postgresql://postgres:pSpbMKwdnzlIZXyYdJVuadTcIJVkyOzb@roundhouse.proxy.rlwy.net:37070/railway';

async function main() {
  // Connect to default 'railway' database
  const client = new Client({ connectionString: conn });
  await client.connect();
  
  // Check if databases already exist
  const { rows: existing } = await client.query(`
    SELECT datname FROM pg_database WHERE datname IN ('fs04_pm', 'fs02_collab')
  `);
  const existingNames = existing.map(r => r.datname);
  
  if (!existingNames.includes('fs04_pm')) {
    await client.query('CREATE DATABASE fs04_pm');
    console.log('Created database: fs04_pm');
  } else {
    console.log('Database fs04_pm already exists');
  }
  
  if (!existingNames.includes('fs02_collab')) {
    await client.query('CREATE DATABASE fs02_collab');
    console.log('Created database: fs02_collab');
  } else {
    console.log('Database fs02_collab already exists');
  }
  
  await client.end();
  console.log('Done');
}

main().catch(e => { console.error(e); process.exit(1); });
