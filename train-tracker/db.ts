import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const poolConfig: PoolConfig = {
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
};

const pool = new Pool(poolConfig);

export default pool;
