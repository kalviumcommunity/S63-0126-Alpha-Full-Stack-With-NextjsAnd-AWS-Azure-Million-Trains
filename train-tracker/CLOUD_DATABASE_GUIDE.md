# Cloud Database Configuration Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [AWS RDS PostgreSQL Setup](#aws-rds-postgresql-setup)
3. [Azure PostgreSQL Setup](#azure-postgresql-setup)
4. [Connection Configuration](#connection-configuration)
5. [Security & Network Access](#security--network-access)
6. [Backup & Maintenance](#backup--maintenance)
7. [Performance Optimization](#performance-optimization)
8. [Cost Management](#cost-management)
9. [Troubleshooting](#troubleshooting)
10. [Migration Strategies](#migration-strategies)

---

## Overview

### Why Managed Databases?

Managed database services like AWS RDS and Azure Database for PostgreSQL provide:

✅ **Automated Backups**: Daily snapshots with point-in-time recovery  
✅ **Patch Management**: Automatic OS and database updates  
✅ **High Availability**: Multi-AZ deployment options  
✅ **Scalability**: Vertical and horizontal scaling  
✅ **Security**: Network isolation, encryption at rest/transit  
✅ **Monitoring**: Built-in metrics and alerting  

### Provider Comparison

| Feature | AWS RDS PostgreSQL | Azure PostgreSQL |
|---------|-------------------|------------------|
| **Pricing Model** | Pay per instance hour | Pay per vCore or DTU |
| **Free Tier** | 750 hours/month (12 months) | No free tier |
| **Max Storage** | 64 TB | 16 TB |
| **Backup Retention** | 1-35 days | 7-35 days |
| **Read Replicas** | Up to 15 | Up to 5 |
| **Multi-AZ** | Yes | No (use read replicas) |
| **IAM Authentication** | Yes | Yes (Azure AD) |
| **Monitoring** | CloudWatch | Azure Monitor |

### Current Setup

Our application uses:
- **ORM**: Prisma
- **Database**: PostgreSQL 14+
- **Connection Pooling**: Prisma built-in
- **Schema Management**: Prisma Migrate

---

## AWS RDS PostgreSQL Setup

### Step 1: Create RDS Instance

#### Via AWS Console

1. **Navigate to RDS**:
   - AWS Console → Services → RDS → Databases → Create database

2. **Choose Database Creation Method**:
   - Select: **Standard Create** (for more options)

3. **Engine Options**:
   - Engine type: **PostgreSQL**
   - Version: **PostgreSQL 15.x** (latest stable)

4. **Templates**:
   - **Production**: Multi-AZ, provisioned IOPS (expensive)
   - **Dev/Test**: Single-AZ, general purpose storage
   - **Free tier**: db.t3.micro, 20 GB storage (12 months free)

5. **Settings**:
   ```
   DB instance identifier: train-tracker-db-prod
   Master username: postgres
   Master password: [Generate secure password - 16+ chars]
   ☑ Auto generate a password (recommended)
   ```

6. **DB Instance Class**:
   - **Free tier**: db.t3.micro (1 vCPU, 1 GB RAM)
   - **Production**: db.t3.small or larger (2 vCPUs, 2+ GB RAM)

7. **Storage**:
   ```
   Storage type: General Purpose SSD (gp3)
   Allocated storage: 20 GB (minimum)
   Storage autoscaling: ☑ Enable (max 100 GB)
   ```

8. **Connectivity**:
   ```
   VPC: Default VPC
   Subnet group: default
   Public access: Yes (for development), No (for production)
   VPC security group: Create new
     - Name: train-tracker-db-sg
   Availability Zone: No preference
   ```

9. **Database Authentication**:
   ```
   ☑ Password authentication
   ☐ IAM database authentication (enable for production)
   ```

10. **Additional Configuration**:
    ```
    Initial database name: traintracker
    DB parameter group: default.postgres15
    Backup retention: 7 days (minimum)
    Backup window: Preferred time (e.g., 03:00-04:00 UTC)
    Maintenance window: Preferred time
    ☑ Enable auto minor version upgrade
    ☑ Enable deletion protection (production only)
    ```

11. **Click Create Database** (takes 5-10 minutes)

#### Via AWS CLI

```bash
aws rds create-db-instance \
  --db-instance-identifier train-tracker-db-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.5 \
  --master-username postgres \
  --master-user-password "YourSecurePassword123!" \
  --allocated-storage 20 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --db-name traintracker \
  --publicly-accessible \
  --tags Key=Environment,Value=Production Key=Project,Value=TrainTracker
```

### Step 2: Configure Security Group

1. **Find your RDS instance** → Connectivity & security tab
2. **Click on the VPC security group**
3. **Edit inbound rules**:

```
Type: PostgreSQL
Protocol: TCP
Port: 5432
Source: 
  - Development: My IP (your current IP)
  - Production: Custom (your app server IP or CIDR)
Description: Train Tracker DB Access
```

**Security Best Practices**:
- ❌ Never use `0.0.0.0/0` (all IPs) in production
- ✅ Use specific IP ranges or security groups
- ✅ Use IAM authentication instead of passwords
- ✅ Enable SSL/TLS connections only

### Step 3: Get Connection Details

1. **RDS Console** → Select your instance → Connectivity & security
2. **Copy endpoint**: `train-tracker-db-prod.xxxxx.us-east-1.rds.amazonaws.com`
3. **Port**: `5432`
4. **Database name**: `traintracker`

### Step 4: Create Connection String

```bash
# Development (.env.local)
DATABASE_URL="postgresql://postgres:YourPassword@train-tracker-db-prod.xxxxx.us-east-1.rds.amazonaws.com:5432/traintracker?schema=public&sslmode=require"

# Production (.env.production - use secrets manager)
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@train-tracker-db-prod.xxxxx.us-east-1.rds.amazonaws.com:5432/traintracker?schema=public&sslmode=require"
```

**Connection String Parameters**:
- `sslmode=require` - Forces SSL/TLS encryption
- `schema=public` - Default schema
- `connection_limit=10` - Max connections per process
- `pool_timeout=20` - Connection pool timeout (seconds)

### Step 5: Test Connection

```bash
# Using psql
psql "postgresql://postgres:YourPassword@train-tracker-db-prod.xxxxx.us-east-1.rds.amazonaws.com:5432/traintracker?sslmode=require"

# Test query
SELECT version();
SELECT current_database();
```

### Step 6: Initialize Database Schema

```bash
# Navigate to project directory
cd train-tracker

# Push Prisma schema to RDS
npx prisma db push

# Or run migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

---

## Azure PostgreSQL Setup

### Step 1: Create Azure PostgreSQL Server

#### Via Azure Portal

1. **Navigate to Azure Portal**:
   - Azure Portal → Create a resource → Databases → Azure Database for PostgreSQL

2. **Deployment Option**:
   - Select: **Flexible Server** (recommended)
   - Alternative: Single Server (legacy, deprecated 2025)

3. **Basics Tab**:
   ```
   Subscription: Your subscription
   Resource group: Create new → train-tracker-rg
   Server name: train-tracker-db-prod
   Region: East US (choose closest to your app)
   PostgreSQL version: 15
   Compute + storage: Configure server
   ```

4. **Compute + Storage**:
   ```
   Compute tier: Burstable
   Compute size: Standard_B1ms (1 vCore, 2 GB RAM)
   Storage: 32 GB
   ☑ Storage autoscaling
   Backup retention: 7 days
   Redundancy: Locally redundant (LRS)
   ```

5. **Administrator Account**:
   ```
   Admin username: pgadmin
   Password: [Strong password 16+ chars]
   Confirm password: [Same password]
   ```

6. **Networking Tab**:
   ```
   Connectivity method: Public access
   Firewall rules:
     ☑ Allow public access from any Azure service
     ☑ Add current client IP address
   ```

7. **Security Tab**:
   ```
   ☐ Enable SSL enforcement (legacy option)
   ☑ TLS 1.2 or higher
   ```

8. **Tags** (optional):
   ```
   Environment: Production
   Project: TrainTracker
   Owner: YourName
   ```

9. **Review + Create** → Create (takes 5-10 minutes)

#### Via Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create \
  --name train-tracker-rg \
  --location eastus

# Create PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group train-tracker-rg \
  --name train-tracker-db-prod \
  --location eastus \
  --admin-user pgadmin \
  --admin-password "YourSecurePassword123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 15 \
  --public-access 0.0.0.0 \
  --tags Environment=Production Project=TrainTracker

# Create database
az postgres flexible-server db create \
  --resource-group train-tracker-rg \
  --server-name train-tracker-db-prod \
  --database-name traintracker
```

### Step 2: Configure Firewall Rules

#### Via Azure Portal

1. **Navigate to your PostgreSQL server** → Networking
2. **Firewall rules** → Add firewall rule

```
Rule name: Development-IP
Start IP: Your.IP.Address.Here
End IP: Your.IP.Address.Here
```

3. **For Azure services**:
```
☑ Allow public access from any Azure service within Azure
```

#### Via Azure CLI

```bash
# Add your current IP
az postgres flexible-server firewall-rule create \
  --resource-group train-tracker-rg \
  --name train-tracker-db-prod \
  --rule-name Development-IP \
  --start-ip-address YOUR_IP_ADDRESS \
  --end-ip-address YOUR_IP_ADDRESS

# Allow Azure services
az postgres flexible-server firewall-rule create \
  --resource-group train-tracker-rg \
  --name train-tracker-db-prod \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### Step 3: Get Connection Details

1. **Azure Portal** → Your PostgreSQL server → Overview
2. **Server name**: `train-tracker-db-prod.postgres.database.azure.com`
3. **Port**: `5432`
4. **Admin username**: `pgadmin@train-tracker-db-prod`
5. **Database name**: `traintracker`

### Step 4: Create Connection String

```bash
# Development (.env.local)
DATABASE_URL="postgresql://pgadmin%40train-tracker-db-prod:YourPassword@train-tracker-db-prod.postgres.database.azure.com:5432/traintracker?schema=public&sslmode=require"

# Production (.env.production - use Azure Key Vault)
DATABASE_URL="postgresql://pgadmin%40train-tracker-db-prod:${DB_PASSWORD}@train-tracker-db-prod.postgres.database.azure.com:5432/traintracker?schema=public&sslmode=require"
```

**Note**: The `@` in username must be URL-encoded as `%40`

### Step 5: Test Connection

```bash
# Using psql
psql "host=train-tracker-db-prod.postgres.database.azure.com port=5432 dbname=traintracker user=pgadmin@train-tracker-db-prod password=YourPassword sslmode=require"

# Test query
SELECT version();
\l  -- List databases
```

### Step 6: Initialize Database Schema

```bash
# Same as AWS RDS
cd train-tracker
npx prisma db push
npx prisma migrate deploy
npx prisma db seed
```

---

## Connection Configuration

### Environment Variables

Create separate environment files for each deployment target:

#### `.env.local` (Local Development)
```bash
# Local PostgreSQL (Docker or native)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/traintracker?schema=public"

# OR RDS/Azure for development
DATABASE_URL="postgresql://user:pass@your-dev-db.amazonaws.com:5432/traintracker?schema=public&sslmode=require"
```

#### `.env.staging` (Staging Environment)
```bash
# AWS RDS Staging
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@train-tracker-db-staging.xxxxx.rds.amazonaws.com:5432/traintracker?schema=public&sslmode=require&connection_limit=10"

# OR Azure Staging
DATABASE_URL="postgresql://pgadmin%40train-tracker-db-staging:${DB_PASSWORD}@train-tracker-db-staging.postgres.database.azure.com:5432/traintracker?schema=public&sslmode=require&connection_limit=10"
```

#### `.env.production` (Production Environment)
```bash
# AWS RDS Production
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@train-tracker-db-prod.xxxxx.rds.amazonaws.com:5432/traintracker?schema=public&sslmode=require&connection_limit=20&pool_timeout=30"

# OR Azure Production
DATABASE_URL="postgresql://pgadmin%40train-tracker-db-prod:${DB_PASSWORD}@train-tracker-db-prod.postgres.database.azure.com:5432/traintracker?schema=public&sslmode=require&connection_limit=20&pool_timeout=30"
```

### Prisma Configuration

Update `prisma/schema.prisma` for production:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pooling for serverless
  directUrl = env("DIRECT_DATABASE_URL") // Optional: for migrations
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["jsonProtocol"] // Faster queries
  binaryTargets   = ["native", "rhel-openssl-1.0.x"] // For AWS Lambda
}
```

### Connection Pool Configuration

#### For Serverless (AWS Lambda, Vercel)

Use a connection pooler like **PgBouncer** or **Supabase Pooler**:

```bash
# .env.production
DATABASE_URL="postgresql://user:pass@pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_DATABASE_URL="postgresql://user:pass@aws-rds-endpoint:5432/traintracker"
```

#### For Long-Running Servers (EC2, Azure VM)

```bash
# .env.production
DATABASE_URL="postgresql://user:pass@rds-endpoint:5432/traintracker?connection_limit=20&pool_timeout=30"
```

### Database Client Configuration

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Connection pool settings
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

---

## Security & Network Access

### AWS RDS Security

#### 1. VPC Configuration

**Best Practice**: Use private subnets with NAT Gateway

```
Internet → ALB (Public Subnet) → App Servers (Private Subnet) → RDS (Private Subnet)
```

**Security Group Rules**:
```
Inbound:
  - Type: PostgreSQL (5432)
    Source: app-server-security-group
    Description: App servers only

Outbound:
  - All traffic allowed (default)
```

#### 2. IAM Database Authentication

Enable IAM auth for RDS:

```bash
# Enable IAM auth
aws rds modify-db-instance \
  --db-instance-identifier train-tracker-db-prod \
  --enable-iam-database-authentication \
  --apply-immediately

# Create IAM policy
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "rds-db:connect",
      "Resource": "arn:aws:rds-db:us-east-1:ACCOUNT_ID:dbuser:*/postgres"
    }
  ]
}

# Attach to app role
aws iam attach-role-policy \
  --role-name YourAppRole \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/RDSConnectPolicy
```

**Connect with IAM token**:

```typescript
import { Signer } from '@aws-sdk/rds-signer';

const signer = new Signer({
  region: 'us-east-1',
  hostname: 'train-tracker-db-prod.xxxxx.rds.amazonaws.com',
  port: 5432,
  username: 'postgres',
});

const token = await signer.getAuthToken();
const connectionString = `postgresql://postgres:${token}@endpoint:5432/traintracker?sslmode=require`;
```

#### 3. Encryption

- **At Rest**: Enable encryption when creating instance (KMS key)
- **In Transit**: Always use `sslmode=require` in connection string

```bash
# Verify SSL
psql "postgresql://...?sslmode=require"
\conninfo  -- Should show "SSL connection"
```

### Azure PostgreSQL Security

#### 1. Private Endpoint

**Best Practice**: Use Private Link for production

```bash
# Create private endpoint
az network private-endpoint create \
  --name train-tracker-db-pe \
  --resource-group train-tracker-rg \
  --vnet-name your-vnet \
  --subnet your-subnet \
  --private-connection-resource-id $(az postgres flexible-server show --name train-tracker-db-prod --resource-group train-tracker-rg --query id -o tsv) \
  --group-id postgresqlServer \
  --connection-name train-tracker-db-connection
```

#### 2. Azure AD Authentication

Enable Azure AD authentication:

```bash
az postgres flexible-server ad-admin create \
  --resource-group train-tracker-rg \
  --server-name train-tracker-db-prod \
  --display-name "DB Admins" \
  --object-id YOUR_AAD_GROUP_ID
```

**Connect with Azure AD token**:

```typescript
import { DefaultAzureCredential } from '@azure/identity';

const credential = new DefaultAzureCredential();
const token = await credential.getToken('https://ossrdbms-aad.database.windows.net');
const connectionString = `postgresql://user@hostname:pass=${token.token}@endpoint:5432/traintracker`;
```

#### 3. Firewall Rules

**Production**: Restrict to specific IP ranges

```bash
# Remove public access
az postgres flexible-server update \
  --resource-group train-tracker-rg \
  --name train-tracker-db-prod \
  --public-access Disabled

# Add specific IP ranges only
az postgres flexible-server firewall-rule create \
  --resource-group train-tracker-rg \
  --name train-tracker-db-prod \
  --rule-name OfficeNetwork \
  --start-ip-address 203.0.113.0 \
  --end-ip-address 203.0.113.255
```

---

## Backup & Maintenance

### AWS RDS Backups

#### Automated Backups

```bash
# Enable automated backups (via console or CLI)
aws rds modify-db-instance \
  --db-instance-identifier train-tracker-db-prod \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --apply-immediately
```

**Retention**:
- Minimum: 7 days
- Maximum: 35 days
- Recommended: 14-30 days for production

#### Manual Snapshots

```bash
# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier train-tracker-db-prod \
  --db-snapshot-identifier train-tracker-pre-deployment-2026-02-23

# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier train-tracker-db-prod

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier train-tracker-db-restored \
  --db-snapshot-identifier train-tracker-pre-deployment-2026-02-23
```

#### Point-in-Time Recovery

```bash
# Restore to specific time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier train-tracker-db-prod \
  --target-db-instance-identifier train-tracker-db-recovery \
  --restore-time 2026-02-23T12:00:00Z
```

### Azure PostgreSQL Backups

#### Automated Backups

Configured during server creation:
- **Retention**: 7-35 days
- **Frequency**: Daily automatic backups
- **Storage**: Geo-redundant or locally redundant

```bash
# Update backup retention
az postgres flexible-server update \
  --resource-group train-tracker-rg \
  --name train-tracker-db-prod \
  --backup-retention 14
```

#### Restore from Backup

```bash
# List recovery points
az postgres flexible-server backup list \
  --resource-group train-tracker-rg \
  --server-name train-tracker-db-prod

# Restore to new server
az postgres flexible-server restore \
  --resource-group train-tracker-rg \
  --name train-tracker-db-restored \
  --source-server train-tracker-db-prod \
  --restore-time "2026-02-23T12:00:00Z"
```

### Backup Best Practices

1. **Test Restores Regularly**: Monthly restore tests
2. **Multiple Retention Policies**:
   - Daily: 7 days
   - Weekly: 4 weeks
   - Monthly: 12 months
3. **Geographic Redundancy**: Enable for disaster recovery
4. **Export Critical Data**: Additional exports to S3/Blob storage

```bash
# Export to S3 (AWS)
pg_dump -h endpoint -U postgres -d traintracker | gzip | aws s3 cp - s3://backups/traintracker-$(date +%Y%m%d).sql.gz

# Export to Azure Blob
pg_dump -h endpoint -U pgadmin -d traintracker | gzip | az storage blob upload --account-name backupstorage --container backups --name traintracker-$(date +%Y%m%d).sql.gz --file -
```

---

## Performance Optimization

### Connection Pooling

#### For AWS RDS

Use **RDS Proxy**:

```bash
# Create RDS Proxy
aws rds create-db-proxy \
  --db-proxy-name train-tracker-proxy \
  --engine-family POSTGRESQL \
  --auth [AuthConfig] \
  --role-arn arn:aws:iam::ACCOUNT_ID:role/RDSProxyRole \
  --vpc-subnet-ids subnet-xxx subnet-yyy
```

**Benefits**:
- Connection pooling and reuse
- Reduced failover time
- IAM authentication support

#### For Azure PostgreSQL

Use **PgBouncer** (self-managed):

```bash
# Install PgBouncer on app server
sudo apt-get install pgbouncer

# Configure /etc/pgbouncer/pgbouncer.ini
[databases]
traintracker = host=train-tracker-db-prod.postgres.database.azure.com port=5432 dbname=traintracker

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
```

### Indexing Strategy

```sql
-- Check missing indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;

-- Create indexes for performance
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_role ON "User"(role);
CREATE INDEX idx_contact_created_at ON "ContactRequest"("createdAt");
CREATE INDEX idx_audit_event_type ON "AuditEvent"("eventType", "createdAt");
```

### Query Optimization

```typescript
// Use Prisma's query optimization features

// 1. Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    fullName: true,
    // Don't fetch password
  },
});

// 2. Use pagination
const users = await prisma.user.findMany({
  take: 10,
  skip: (page - 1) * 10,
});

// 3. Use cursor-based pagination for large datasets
const users = await prisma.user.findMany({
  take: 10,
  cursor: { id: lastUserId },
});

// 4. Batch queries
const [users, count] = await prisma.$transaction([
  prisma.user.findMany(),
  prisma.user.count(),
]);
```

### Monitoring

#### AWS RDS CloudWatch Metrics

- `CPUUtilization`
- `DatabaseConnections`
- `FreeableMemory`
- `ReadLatency` / `WriteLatency`
- `ReadIOPS` / `WriteIOPS`

```bash
# Get metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=train-tracker-db-prod \
  --start-time 2026-02-23T00:00:00Z \
  --end-time 2026-02-23T23:59:59Z \
  --period 3600 \
  --statistics Average,Maximum
```

#### Azure Monitor Metrics

```bash
# View metrics
az monitor metrics list \
  --resource /subscriptions/SUB_ID/resourceGroups/train-tracker-rg/providers/Microsoft.DBforPostgreSQL/flexibleServers/train-tracker-db-prod \
  --metric cpu_percent,memory_percent,active_connections
```

---

## Cost Management

### AWS RDS Pricing

**Example Monthly Cost** (us-east-1):

| Instance | Storage | Backup | Total |
|----------|---------|--------|-------|
| db.t3.micro (free tier) | 20 GB gp3 | 20 GB backup | $0 (first 12 months) |
| db.t3.small | 20 GB gp3 | 20 GB backup | ~$35/month |
| db.t3.medium | 100 GB gp3 | 100 GB backup | ~$120/month |

**Cost Optimization**:
- ✅ Use Reserved Instances (1-3 years, 30-60% savings)
- ✅ Enable storage autoscaling to avoid over-provisioning
- ✅ Use read replicas instead of larger instances
- ✅ Delete old snapshots regularly

### Azure PostgreSQL Pricing

**Example Monthly Cost** (East US):

| Tier | vCores | Storage | Total |
|------|--------|---------|-------|
| Burstable B1ms | 1 vCore | 32 GB | ~$20/month |
| General Purpose D2s_v3 | 2 vCores | 128 GB | ~$150/month |
| Memory Optimized E2s_v3 | 2 vCores | 128 GB | ~$250/month |

**Cost Optimization**:
- ✅ Use Burstable tier for dev/test
- ✅ Enable storage autoscaling
- ✅ Use Azure Reservations (1-3 years, up to 60% savings)
- ✅ Right-size your instance based on metrics

### Cost Monitoring

```bash
# AWS Cost Explorer
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-28 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://rds-filter.json

# Azure Cost Management
az consumption usage list \
  --start-date 2026-02-01 \
  --end-date 2026-02-28 \
  --query "[?contains(instanceName, 'train-tracker-db')]"
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Connection Timeout

**Symptoms**: `Error: P1001: Can't reach database server`

**Solutions**:
1. Check security group/firewall rules
2. Verify public access is enabled (development)
3. Test network connectivity: `telnet endpoint 5432`
4. Check VPC/subnet configuration

```bash
# Test connection
nc -zv train-tracker-db-prod.xxxxx.rds.amazonaws.com 5432
```

#### Issue 2: Authentication Failed

**Symptoms**: `Error: password authentication failed for user "postgres"`

**Solutions**:
1. Verify username format (Azure requires `username@servername`)
2. URL-encode special characters in password
3. Check IAM authentication settings
4. Reset password if needed

```bash
# AWS - Reset password
aws rds modify-db-instance \
  --db-instance-identifier train-tracker-db-prod \
  --master-user-password "NewPassword123!"

# Azure - Reset password
az postgres flexible-server update \
  --resource-group train-tracker-rg \
  --name train-tracker-db-prod \
  --admin-password "NewPassword123!"
```

#### Issue 3: Too Many Connections

**Symptoms**: `Error: sorry, too many clients already`

**Solutions**:
1. Increase `max_connections` parameter
2. Implement connection pooling
3. Close idle connections
4. Use RDS Proxy / PgBouncer

```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
AND state_change < NOW() - INTERVAL '10 minutes';
```

#### Issue 4: Slow Queries

**Symptoms**: High latency, timeout errors

**Solutions**:
1. Enable query logging
2. Analyze slow queries
3. Add indexes
4. Optimize queries

```sql
-- Enable slow query log (AWS RDS)
-- Set parameter: log_min_duration_statement = 1000 (1 second)

-- Find slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Debugging Checklist

- [ ] Verify DATABASE_URL is correct
- [ ] Check firewall/security group rules
- [ ] Confirm database instance is running
- [ ] Test network connectivity (`telnet`, `nc`)
- [ ] Verify SSL/TLS is enabled
- [ ] Check connection pool settings
- [ ] Review database logs
- [ ] Monitor CloudWatch/Azure Monitor metrics

---

## Migration Strategies

### Local to Cloud Migration

#### Step 1: Export Local Database

```bash
# Export from local PostgreSQL
pg_dump -h localhost -U postgres -d traintracker -F c -f traintracker-backup.dump

# Or use Prisma
npx prisma db push --skip-generate  # Push schema
```

#### Step 2: Import to Cloud Database

```bash
# Import to AWS RDS
pg_restore -h train-tracker-db-prod.xxxxx.rds.amazonaws.com \
  -U postgres -d traintracker \
  -F c traintracker-backup.dump

# Or import to Azure
pg_restore -h train-tracker-db-prod.postgres.database.azure.com \
  -U pgadmin@train-tracker-db-prod -d traintracker \
  -F c traintracker-backup.dump
```

#### Step 3: Verify Migration

```bash
# Connect to cloud database
psql "postgresql://user:pass@endpoint:5432/traintracker?sslmode=require"

# Verify tables
\dt

# Verify row counts
SELECT 
  schemaname,
  tablename,
  n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

### Zero-Downtime Migration

1. **Set up read replica** from local to cloud
2. **Replicate data** continuously
3. **Switch writes** to cloud database
4. **Monitor** for issues
5. **Decommission** local database

### Prisma Migrate Workflow

```bash
# 1. Generate migration from schema changes
npx prisma migrate dev --name add_new_feature

# 2. Review migration SQL
cat prisma/migrations/XXX_add_new_feature/migration.sql

# 3. Test on staging
DATABASE_URL=staging npx prisma migrate deploy

# 4. Deploy to production
DATABASE_URL=production npx prisma migrate deploy

# 5. Verify
npx prisma studio
```

---

## Summary

This guide covered:

✅ **AWS RDS PostgreSQL** - Setup, security, backups  
✅ **Azure PostgreSQL** - Configuration, networking, monitoring  
✅ **Connection Management** - Environment configs, pooling  
✅ **Security** - IAM auth, VPC, encryption  
✅ **Backups** - Automated, manual, point-in-time recovery  
✅ **Performance** - Indexing, pooling, optimization  
✅ **Cost Management** - Pricing, optimization strategies  
✅ **Troubleshooting** - Common issues and solutions  
✅ **Migration** - Local to cloud, zero-downtime strategies  

### Next Steps

1. ✅ Choose your cloud provider (AWS or Azure)
2. ✅ Provision production database instance
3. ✅ Configure security groups/firewall rules
4. ✅ Set up automated backups
5. ✅ Enable monitoring and alerting
6. ✅ Test connection from your application
7. ✅ Run database migrations
8. ✅ Set up read replicas (optional)
9. ✅ Implement connection pooling
10. ✅ Document credentials in secrets manager

### Additional Resources

- [AWS RDS PostgreSQL Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [Azure PostgreSQL Documentation](https://learn.microsoft.com/en-us/azure/postgresql/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

**Last Updated**: February 23, 2026  
**Version**: 1.0  
**Status**: Production Ready
