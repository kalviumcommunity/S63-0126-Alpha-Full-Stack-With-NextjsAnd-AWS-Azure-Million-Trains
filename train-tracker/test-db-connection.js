import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/train_tracker'
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('✅ Query result:', res.rows[0]);
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
