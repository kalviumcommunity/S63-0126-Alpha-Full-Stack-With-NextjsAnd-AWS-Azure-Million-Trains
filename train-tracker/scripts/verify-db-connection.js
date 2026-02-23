#!/usr/bin/env node

/**
 * Cloud Database Connection Verifier
 * Tests connection to AWS RDS or Azure PostgreSQL
 * 
 * Usage:
 *   node scripts/verify-db-connection.js
 *   DATABASE_URL=postgresql://... node scripts/verify-db-connection.js
 */

const { Client } = require('pg');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log(`${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function verifyConnection() {
  logSection('Cloud Database Connection Verifier');
  
  // Get DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    logError('DATABASE_URL environment variable is not set');
    logInfo('Please set DATABASE_URL in your .env file or environment');
    logInfo('Example: DATABASE_URL="postgresql://user:pass@host:5432/dbname"');
    process.exit(1);
  }
  
  // Parse connection URL
  let connectionInfo;
  try {
    const url = new URL(databaseUrl);
    connectionInfo = {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.slice(1).split('?')[0],
      user: url.username,
      password: url.password ? '***' : 'not set',
      ssl: url.searchParams.get('sslmode') === 'require',
    };
    
    // Detect provider
    if (url.hostname.includes('.rds.amazonaws.com')) {
      connectionInfo.provider = 'AWS RDS';
    } else if (url.hostname.includes('.postgres.database.azure.com')) {
      connectionInfo.provider = 'Azure PostgreSQL';
    } else if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      connectionInfo.provider = 'Local PostgreSQL';
    } else {
      connectionInfo.provider = 'Unknown';
    }
  } catch (error) {
    logError(`Invalid DATABASE_URL format: ${error.message}`);
    process.exit(1);
  }
  
  logSection('Connection Information');
  logInfo(`Provider: ${connectionInfo.provider}`);
  logInfo(`Host: ${connectionInfo.host}`);
  logInfo(`Port: ${connectionInfo.port}`);
  logInfo(`Database: ${connectionInfo.database}`);
  logInfo(`User: ${connectionInfo.user}`);
  logInfo(`Password: ${connectionInfo.password}`);
  logInfo(`SSL: ${connectionInfo.ssl ? 'Enabled' : 'Disabled'}`);
  
  if (!connectionInfo.ssl && connectionInfo.provider !== 'Local PostgreSQL') {
    logWarning('SSL is not enabled. For cloud databases, always use sslmode=require');
  }
  
  // Create client
  const client = new Client({
    connectionString: databaseUrl,
    ssl: connectionInfo.ssl ? {
      rejectUnauthorized: false, // Accept self-signed certificates
    } : false,
  });
  
  logSection('Testing Connection');
  
  try {
    // Connect
    logInfo('Connecting to database...');
    await client.connect();
    logSuccess('Connection established successfully');
    
    // Test 1: Check PostgreSQL version
    logSection('Database Information');
    const versionResult = await client.query('SELECT version()');
    const version = versionResult.rows[0].version;
    logInfo(`PostgreSQL Version: ${version.split(',')[0]}`);
    
    // Test 2: Check current database and user
    const dbInfoResult = await client.query(`
      SELECT 
        current_database() as database,
        current_user as user,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port
    `);
    const dbInfo = dbInfoResult.rows[0];
    logInfo(`Current Database: ${dbInfo.database}`);
    logInfo(`Current User: ${dbInfo.user}`);
    if (dbInfo.server_ip) {
      logInfo(`Server IP: ${dbInfo.server_ip}`);
    }
    logInfo(`Server Port: ${dbInfo.server_port}`);
    
    // Test 3: Check SSL status
    const sslResult = await client.query(`
      SELECT 
        CASE 
          WHEN ssl IS TRUE THEN 'Yes'
          ELSE 'No'
        END as ssl_enabled
      FROM pg_stat_ssl
      WHERE pid = pg_backend_pid()
    `);
    const sslStatus = sslResult.rows[0]?.ssl_enabled || 'Unknown';
    if (sslStatus === 'Yes') {
      logSuccess(`SSL Connection: ${sslStatus}`);
    } else if (connectionInfo.provider === 'Local PostgreSQL') {
      logInfo(`SSL Connection: ${sslStatus} (OK for local)`);
    } else {
      logWarning(`SSL Connection: ${sslStatus} (Should be enabled for cloud databases)`);
    }
    
    // Test 4: Check available databases
    logSection('Available Databases');
    const databasesResult = await client.query(`
      SELECT datname, pg_size_pretty(pg_database_size(datname)) as size
      FROM pg_database
      WHERE datistemplate = false
      ORDER BY datname
    `);
    logInfo(`Found ${databasesResult.rows.length} databases:`);
    databasesResult.rows.forEach(db => {
      logInfo(`  - ${db.datname} (${db.size})`);
    });
    
    // Test 5: Check tables in current database
    logSection('Database Schema');
    const tablesResult = await client.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schemaname, tablename
    `);
    
    if (tablesResult.rows.length === 0) {
      logWarning('No tables found in database');
      logInfo('Run "npx prisma db push" or "npx prisma migrate deploy" to create tables');
    } else {
      logInfo(`Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(table => {
        logInfo(`  - ${table.schemaname}.${table.tablename} (${table.size})`);
      });
    }
    
    // Test 6: Check active connections
    logSection('Connection Statistics');
    const connectionsResult = await client.query(`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        max(setting::int) as max_connections
      FROM pg_stat_activity, pg_settings
      WHERE pg_settings.name = 'max_connections'
    `);
    const connStats = connectionsResult.rows[0];
    logInfo(`Total Connections: ${connStats.total_connections}`);
    logInfo(`Active Connections: ${connStats.active_connections}`);
    logInfo(`Idle Connections: ${connStats.idle_connections}`);
    logInfo(`Max Connections: ${connStats.max_connections}`);
    
    const connectionUsage = (connStats.total_connections / connStats.max_connections) * 100;
    if (connectionUsage > 80) {
      logWarning(`Connection usage is ${connectionUsage.toFixed(1)}% - consider connection pooling`);
    } else {
      logSuccess(`Connection usage: ${connectionUsage.toFixed(1)}%`);
    }
    
    // Test 7: Check database size
    const sizeResult = await client.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as db_size
    `);
    logInfo(`Database Size: ${sizeResult.rows[0].db_size}`);
    
    // Test 8: Check Prisma migrations
    logSection('Prisma Migrations');
    try {
      const migrationsResult = await client.query(`
        SELECT 
          migration_name,
          finished_at,
          applied_steps_count
        FROM "_prisma_migrations"
        ORDER BY finished_at DESC
        LIMIT 5
      `);
      
      if (migrationsResult.rows.length === 0) {
        logWarning('No Prisma migrations found');
        logInfo('Run "npx prisma migrate deploy" to apply migrations');
      } else {
        logInfo(`Last ${migrationsResult.rows.length} migrations:`);
        migrationsResult.rows.forEach(migration => {
          const date = new Date(migration.finished_at).toLocaleString();
          logInfo(`  - ${migration.migration_name} (${date})`);
        });
      }
    } catch (error) {
      logWarning('Could not read Prisma migrations table');
      logInfo('This is normal if migrations haven\'t been run yet');
    }
    
    // Test 9: Performance check
    logSection('Performance Test');
    const startTime = Date.now();
    await client.query('SELECT 1');
    const queryTime = Date.now() - startTime;
    
    if (queryTime < 50) {
      logSuccess(`Query latency: ${queryTime}ms (Excellent)`);
    } else if (queryTime < 100) {
      logInfo(`Query latency: ${queryTime}ms (Good)`);
    } else if (queryTime < 200) {
      logWarning(`Query latency: ${queryTime}ms (Acceptable)`);
    } else {
      logWarning(`Query latency: ${queryTime}ms (High - check network/database performance)`);
    }
    
    // Summary
    logSection('Verification Summary');
    logSuccess('All connection tests passed successfully');
    logSuccess('Database is ready to use');
    
    if (tablesResult.rows.length === 0) {
      console.log('');
      logInfo('Next steps:');
      logInfo('  1. Run: npx prisma db push');
      logInfo('  2. Or: npx prisma migrate deploy');
      logInfo('  3. Optional: npx prisma db seed');
    }
    
  } catch (error) {
    logSection('Connection Failed');
    logError(`Error: ${error.message}`);
    
    // Provide helpful error messages
    if (error.message.includes('ENOTFOUND')) {
      logInfo('Host not found. Check your DATABASE_URL hostname.');
    } else if (error.message.includes('ECONNREFUSED')) {
      logInfo('Connection refused. Check:');
      logInfo('  - Database instance is running');
      logInfo('  - Security group/firewall allows your IP');
      logInfo('  - Port 5432 is accessible');
    } else if (error.message.includes('password authentication failed')) {
      logInfo('Authentication failed. Check:');
      logInfo('  - Username is correct');
      logInfo('  - Password is correct');
      logInfo('  - For Azure: username should be "user@servername"');
    } else if (error.message.includes('timeout')) {
      logInfo('Connection timeout. Check:');
      logInfo('  - Network connectivity');
      logInfo('  - VPC/subnet configuration');
      logInfo('  - NAT Gateway (if using private subnet)');
    } else if (error.message.includes('SSL')) {
      logInfo('SSL error. Try adding "?sslmode=require" to your DATABASE_URL');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run verification
verifyConnection().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
