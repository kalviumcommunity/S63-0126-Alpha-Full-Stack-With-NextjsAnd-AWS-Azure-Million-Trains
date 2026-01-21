import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({
	connectionString,
	ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
});

export default pool;
