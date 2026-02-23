#!/usr/bin/env node

/**
 * Quick Database Connection Test
 * Minimal script to test if database is reachable
 * 
 * Usage:
 *   node scripts/quick-db-test.js
 *   DATABASE_URL=postgresql://... node scripts/quick-db-test.js
 */

const { Client } = require('pg');

async function quickTest() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set');
    console.log('Set DATABASE_URL in your .env file');
    process.exit(1);
  }
  
  console.log('🔍 Testing database connection...');
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=require') ? {
      rejectUnauthorized: false,
    } : false,
  });
  
  try {
    await client.connect();
    console.log('✅ Connected successfully');
    
    const result = await client.query('SELECT NOW(), current_database(), current_user');
    console.log('✅ Database:', result.rows[0].current_database);
    console.log('✅ User:', result.rows[0].current_user);
    console.log('✅ Server time:', result.rows[0].now);
    
    await client.end();
    console.log('\n✨ Database is ready to use!\n');
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Tip: Check your hostname in DATABASE_URL');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Tip: Check security group/firewall rules');
    } else if (error.message.includes('password')) {
      console.log('💡 Tip: Check username and password');
    }
    
    process.exit(1);
  }
}

quickTest();
