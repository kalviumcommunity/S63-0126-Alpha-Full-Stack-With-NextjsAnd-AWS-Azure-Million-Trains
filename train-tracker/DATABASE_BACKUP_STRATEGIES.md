# Database Backup Strategies

## Table of Contents
1. [Backup Overview](#backup-overview)
2. [AWS RDS Backup Strategies](#aws-rds-backup-strategies)
3. [Azure PostgreSQL Backup Strategies](#azure-postgresql-backup-strategies)
4. [Manual Backup Procedures](#manual-backup-procedures)
5. [Point-in-Time Recovery (PITR)](#point-in-time-recovery-pitr)
6. [Disaster Recovery Planning](#disaster-recovery-planning)
7. [Backup Testing & Validation](#backup-testing--validation)
8. [Restore Procedures](#restore-procedures)
9. [Backup Automation Scripts](#backup-automation-scripts)
10. [Cost Optimization](#cost-optimization)

---

## Backup Overview

### Why Backup Strategies Matter

**Business Impact:**
- **Data Loss Prevention**: 60% of companies that lose their data shut down within 6 months
- **Compliance Requirements**: GDPR, HIPAA, SOC2 require backup retention policies
- **Recovery Time Objective (RTO)**: Target time to restore service (< 1 hour recommended)
- **Recovery Point Objective (RPO)**: Maximum acceptable data loss (< 15 minutes recommended)

### Backup Strategy Types

| Strategy | RTO | RPO | Cost | Use Case |
|----------|-----|-----|------|----------|
| **Automated Daily** | 2-4 hours | 24 hours | Low | Development/Staging |
| **Continuous with PITR** | 15-30 min | 5 minutes | Medium | Production |
| **Multi-Region Replication** | 5-10 min | Real-time | High | Mission-Critical |
| **Snapshot + Transaction Logs** | 30 min | 1 minute | Medium-High | E-commerce/Financial |

### 3-2-1 Backup Rule

✅ **3 copies** of data (1 primary + 2 backups)  
✅ **2 different media** types (local disk + cloud storage)  
✅ **1 offsite** backup (different region or provider)

---

## AWS RDS Backup Strategies

### 1. Automated Backups

**Configuration:**

```bash
# Enable automated backups via AWS CLI
aws rds modify-db-instance \
    --db-instance-identifier train-tracker-db-prod \
    --backup-retention-period 30 \
    --preferred-backup-window "03:00-04:00" \
    --region us-east-1

# Verify backup configuration
aws rds describe-db-instances \
    --db-instance-identifier train-tracker-db-prod \
    --query 'DBInstances[0].{BackupRetention:BackupRetentionPeriod,Window:PreferredBackupWindow,LatestBackup:LatestRestorableTime}' \
    --output table
```

**Via CloudFormation:**

```yaml
# cloudformation/rds-backup.yml
AWSTemplateFormatVersion: '2010-09-09'
Description: RDS PostgreSQL with Backup Configuration

Resources:
  TrainTrackerDB:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: train-tracker-db-prod
      Engine: postgres
      EngineVersion: '15.4'
      DBInstanceClass: db.t3.medium
      AllocatedStorage: 100
      StorageType: gp3
      MasterUsername: postgres
      MasterUserPassword: !Sub '{{resolve:secretsmanager:train-tracker-db-password:SecretString:password}}'
      
      # Backup Configuration
      BackupRetentionPeriod: 30  # 30 days retention
      PreferredBackupWindow: "03:00-04:00"  # 3 AM UTC daily
      CopyTagsToSnapshot: true
      DeleteAutomatedBackups: false  # Keep backups after deletion
      
      # Point-in-Time Recovery
      EnableCloudwatchLogsExports:
        - postgresql
      
      # Multi-AZ for high availability
      MultiAZ: true
      
      # Storage encryption
      StorageEncrypted: true
      KmsKeyId: !Ref DBEncryptionKey

  DBEncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: Encryption key for RDS backups
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'

Outputs:
  DBInstanceArn:
    Value: !GetAtt TrainTrackerDB.DBInstanceArn
    Export:
      Name: !Sub '${AWS::StackName}-DBInstanceArn'
  
  BackupRetention:
    Value: !GetAtt TrainTrackerDB.BackupRetentionPeriod
    Description: Automated backup retention period in days
```

### 2. Manual Snapshots

**Create Snapshot:**

```bash
# Create manual snapshot
aws rds create-db-snapshot \
    --db-instance-identifier train-tracker-db-prod \
    --db-snapshot-identifier train-tracker-snapshot-$(date +%Y%m%d-%H%M%S) \
    --region us-east-1

# List all snapshots
aws rds describe-db-snapshots \
    --db-instance-identifier train-tracker-db-prod \
    --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime,Status,PercentProgress]' \
    --output table
```

**Automated Snapshot Script:**

```bash
#!/bin/bash
# scripts/aws-snapshot.sh

set -e

DB_INSTANCE="train-tracker-db-prod"
REGION="us-east-1"
RETENTION_DAYS=90
SNAPSHOT_PREFIX="manual-backup"

# Create snapshot
SNAPSHOT_ID="${SNAPSHOT_PREFIX}-$(date +%Y%m%d-%H%M%S)"
echo "Creating snapshot: $SNAPSHOT_ID"

aws rds create-db-snapshot \
    --db-instance-identifier $DB_INSTANCE \
    --db-snapshot-identifier $SNAPSHOT_ID \
    --region $REGION \
    --tags Key=Type,Value=Manual Key=CreatedBy,Value=BackupScript

# Wait for completion
echo "Waiting for snapshot to complete..."
aws rds wait db-snapshot-available \
    --db-snapshot-identifier $SNAPSHOT_ID \
    --region $REGION

echo "Snapshot created successfully: $SNAPSHOT_ID"

# Delete old snapshots (older than RETENTION_DAYS)
echo "Cleaning up old snapshots..."
CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)

aws rds describe-db-snapshots \
    --db-instance-identifier $DB_INSTANCE \
    --region $REGION \
    --query "DBSnapshots[?SnapshotCreateTime<'$CUTOFF_DATE' && starts_with(DBSnapshotIdentifier, '$SNAPSHOT_PREFIX')].DBSnapshotIdentifier" \
    --output text | while read snapshot; do
    if [ ! -z "$snapshot" ]; then
        echo "Deleting old snapshot: $snapshot"
        aws rds delete-db-snapshot \
            --db-snapshot-identifier $snapshot \
            --region $REGION
    fi
done

echo "Backup completed successfully"
```

### 3. Cross-Region Backup Replication

```bash
# Copy snapshot to another region for disaster recovery
aws rds copy-db-snapshot \
    --source-db-snapshot-identifier arn:aws:rds:us-east-1:123456789012:snapshot:train-tracker-snapshot-20240101-120000 \
    --target-db-snapshot-identifier train-tracker-snapshot-20240101-120000 \
    --region us-west-2 \
    --kms-key-id arn:aws:kms:us-west-2:123456789012:key/abcd1234-5678-90ab-cdef-1234567890ab \
    --copy-tags

# Monitor copy progress
aws rds describe-db-snapshots \
    --db-snapshot-identifier train-tracker-snapshot-20240101-120000 \
    --region us-west-2 \
    --query 'DBSnapshots[0].[PercentProgress,Status]' \
    --output table
```

### 4. Export to S3

```bash
# Export snapshot to S3 for long-term archival
aws rds start-export-task \
    --export-task-identifier train-tracker-export-$(date +%Y%m%d) \
    --source-arn arn:aws:rds:us-east-1:123456789012:snapshot:train-tracker-snapshot-20240101-120000 \
    --s3-bucket-name train-tracker-db-backups \
    --s3-prefix exports/2024/01/ \
    --iam-role-arn arn:aws:iam::123456789012:role/rds-s3-export-role \
    --kms-key-id arn:aws:kms:us-east-1:123456789012:key/abcd1234-5678-90ab-cdef-1234567890ab

# Check export status
aws rds describe-export-tasks \
    --export-task-identifier train-tracker-export-20240101
```

---

## Azure PostgreSQL Backup Strategies

### 1. Automated Backups

**Configuration via Azure CLI:**

```bash
# Configure backup retention
az postgres flexible-server update \
    --name train-tracker-db-prod \
    --resource-group train-tracker-rg \
    --backup-retention 30 \
    --geo-redundant-backup Enabled

# Verify backup configuration
az postgres flexible-server show \
    --name train-tracker-db-prod \
    --resource-group train-tracker-rg \
    --query '{BackupRetention:backup.backupRetentionDays,GeoRedundant:backup.geoRedundantBackup,EarliestRestore:backup.earliestRestoreDate}' \
    --output table
```

**Via ARM Template:**

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "resources": [
    {
      "type": "Microsoft.DBforPostgreSQL/flexibleServers",
      "apiVersion": "2022-12-01",
      "name": "train-tracker-db-prod",
      "location": "eastus",
      "sku": {
        "name": "Standard_D2s_v3",
        "tier": "GeneralPurpose"
      },
      "properties": {
        "administratorLogin": "pgadmin",
        "administratorLoginPassword": "[parameters('adminPassword')]",
        "version": "15",
        "storage": {
          "storageSizeGB": 128
        },
        "backup": {
          "backupRetentionDays": 30,
          "geoRedundantBackup": "Enabled"
        },
        "highAvailability": {
          "mode": "ZoneRedundant"
        }
      }
    }
  ]
}
```

### 2. On-Demand Backups

```bash
# Azure doesn't support manual backups directly
# Use pg_dump for manual backups

# Create backup directory
mkdir -p backups/azure/$(date +%Y%m%d)

# Perform backup using pg_dump
PGPASSWORD=$DB_PASSWORD pg_dump \
    -h train-tracker-db-prod.postgres.database.azure.com \
    -U pgadmin@train-tracker-db-prod \
    -d traintracker \
    -F c \
    -b \
    -v \
    -f backups/azure/$(date +%Y%m%d)/traintracker-$(date +%Y%m%d-%H%M%S).backup

# Compress backup
gzip backups/azure/$(date +%Y%m%d)/traintracker-*.backup

# Upload to Azure Blob Storage
az storage blob upload \
    --account-name traintrackerstorage \
    --container-name database-backups \
    --name traintracker-$(date +%Y%m%d-%H%M%S).backup.gz \
    --file backups/azure/$(date +%Y%m%d)/traintracker-*.backup.gz \
    --auth-mode key
```

### 3. Geo-Redundant Backups

```bash
# Enable geo-redundant backups for disaster recovery
az postgres flexible-server update \
    --name train-tracker-db-prod \
    --resource-group train-tracker-rg \
    --geo-redundant-backup Enabled

# Create read replica in different region
az postgres flexible-server replica create \
    --name train-tracker-db-replica-west \
    --resource-group train-tracker-rg \
    --source-server train-tracker-db-prod \
    --location westus2

# List replicas
az postgres flexible-server replica list \
    --name train-tracker-db-prod \
    --resource-group train-tracker-rg \
    --output table
```

### 4. Long-Term Retention (LTR)

```bash
# Azure PostgreSQL doesn't have built-in LTR
# Use Azure Backup or custom solution

# Install Azure Backup agent (if using Azure Backup)
# Or use automated pg_dump with Azure Blob Storage lifecycle policies

# Create lifecycle management policy
az storage account management-policy create \
    --account-name traintrackerstorage \
    --resource-group train-tracker-rg \
    --policy '{
      "rules": [
        {
          "enabled": true,
          "name": "archive-old-backups",
          "type": "Lifecycle",
          "definition": {
            "actions": {
              "baseBlob": {
                "tierToCool": {
                  "daysAfterModificationGreaterThan": 30
                },
                "tierToArchive": {
                  "daysAfterModificationGreaterThan": 90
                },
                "delete": {
                  "daysAfterModificationGreaterThan": 365
                }
              }
            },
            "filters": {
              "blobTypes": ["blockBlob"],
              "prefixMatch": ["database-backups/"]
            }
          }
        }
      ]
    }'
```

---

## Manual Backup Procedures

### 1. Using pg_dump

**Full Database Backup:**

```bash
# Custom format (recommended - smaller size, parallel restore)
pg_dump -h localhost -U postgres -d traintracker \
    -F c -b -v \
    -f backups/traintracker-$(date +%Y%m%d-%H%M%S).backup

# Plain SQL format (human-readable)
pg_dump -h localhost -U postgres -d traintracker \
    -F p -b -v \
    -f backups/traintracker-$(date +%Y%m%d-%H%M%S).sql

# Directory format (parallel dump - fastest for large DBs)
pg_dump -h localhost -U postgres -d traintracker \
    -F d -j 4 -b -v \
    -f backups/traintracker-$(date +%Y%m%d-%H%M%S)
```

**Schema-Only Backup:**

```bash
# Backup only schema (tables, indexes, constraints)
pg_dump -h localhost -U postgres -d traintracker \
    --schema-only \
    -f backups/schema-$(date +%Y%m%d).sql
```

**Data-Only Backup:**

```bash
# Backup only data (useful for testing)
pg_dump -h localhost -U postgres -d traintracker \
    --data-only \
    -f backups/data-$(date +%Y%m%d).sql
```

**Table-Specific Backup:**

```bash
# Backup specific tables
pg_dump -h localhost -U postgres -d traintracker \
    -t users -t bookings -t trains \
    -f backups/critical-tables-$(date +%Y%m%d).sql
```

### 2. Using pg_dumpall

```bash
# Backup all databases + global objects (roles, tablespaces)
pg_dumpall -h localhost -U postgres \
    -f backups/cluster-backup-$(date +%Y%m%d).sql

# Backup only global objects
pg_dumpall -h localhost -U postgres \
    --globals-only \
    -f backups/globals-$(date +%Y%m%d).sql
```

### 3. Automated Backup Script

```bash
#!/bin/bash
# scripts/manual-backup.sh

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-traintracker}"
BACKUP_DIR="backups/manual"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Generate backup filename
BACKUP_FILE="$BACKUP_DIR/traintracker-$(date +%Y%m%d-%H%M%S).backup"

echo "Starting backup of $DB_NAME..."

# Perform backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
    -F c -b -v \
    -f $BACKUP_FILE

# Compress backup
echo "Compressing backup..."
gzip $BACKUP_FILE

# Calculate backup size
BACKUP_SIZE=$(du -h ${BACKUP_FILE}.gz | cut -f1)
echo "Backup completed: ${BACKUP_FILE}.gz ($BACKUP_SIZE)"

# Verify backup
echo "Verifying backup integrity..."
pg_restore -l ${BACKUP_FILE}.gz > /dev/null
echo "Backup verification successful"

# Upload to cloud storage (optional)
if [ ! -z "$S3_BUCKET" ]; then
    echo "Uploading to S3..."
    aws s3 cp ${BACKUP_FILE}.gz s3://$S3_BUCKET/manual-backups/
fi

if [ ! -z "$AZURE_STORAGE_ACCOUNT" ]; then
    echo "Uploading to Azure Blob Storage..."
    az storage blob upload \
        --account-name $AZURE_STORAGE_ACCOUNT \
        --container-name database-backups \
        --name manual-backups/$(basename ${BACKUP_FILE}.gz) \
        --file ${BACKUP_FILE}.gz
fi

# Cleanup old backups
echo "Cleaning up old backups..."
find $BACKUP_DIR -name "*.backup.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup process completed successfully"
```

---

## Point-in-Time Recovery (PITR)

### AWS RDS PITR

**Restore to Specific Time:**

```bash
# Restore to 5 minutes ago
aws rds restore-db-instance-to-point-in-time \
    --source-db-instance-identifier train-tracker-db-prod \
    --target-db-instance-identifier train-tracker-db-restored-$(date +%Y%m%d) \
    --restore-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ) \
    --region us-east-1

# Check latest restorable time
aws rds describe-db-instances \
    --db-instance-identifier train-tracker-db-prod \
    --query 'DBInstances[0].LatestRestorableTime' \
    --output text
```

**Restore to Latest:**

```bash
# Restore to latest available point
aws rds restore-db-instance-to-point-in-time \
    --source-db-instance-identifier train-tracker-db-prod \
    --target-db-instance-identifier train-tracker-db-restored-latest \
    --use-latest-restorable-time \
    --region us-east-1
```

### Azure PostgreSQL PITR

```bash
# Restore to specific time
az postgres flexible-server restore \
    --name train-tracker-db-restored \
    --resource-group train-tracker-rg \
    --source-server train-tracker-db-prod \
    --restore-time "2024-01-15T10:30:00Z"

# Check earliest restore point
az postgres flexible-server show \
    --name train-tracker-db-prod \
    --resource-group train-tracker-rg \
    --query 'backup.earliestRestoreDate' \
    --output tsv
```

### PITR Best Practices

1. **Test Recovery Window**: Verify you can restore to any point within retention period
2. **Monitor Transaction Logs**: Ensure logs are being archived properly
3. **Document RTO/RPO**: Recovery time < 30 min, data loss < 5 min
4. **Automate Testing**: Run monthly PITR tests to validate process

---

## Disaster Recovery Planning

### 1. RTO & RPO Definitions

**Recovery Time Objective (RTO):**
- Time from disaster to full service restoration
- **Target**: < 1 hour for production systems

**Recovery Point Objective (RPO):**
- Maximum acceptable data loss in time
- **Target**: < 15 minutes for production systems

### 2. DR Tiers

| Tier | RTO | RPO | Cost | Configuration |
|------|-----|-----|------|---------------|
| **Tier 1 (Mission-Critical)** | < 15 min | < 5 min | $$$$ | Multi-region active-active + PITR |
| **Tier 2 (Business-Critical)** | < 1 hour | < 15 min | $$$ | Multi-AZ + automated backups + read replicas |
| **Tier 3 (Important)** | < 4 hours | < 1 hour | $$ | Daily automated backups + PITR |
| **Tier 4 (Non-Critical)** | < 24 hours | < 24 hours | $ | Weekly manual backups |

### 3. AWS Multi-AZ Configuration

```yaml
# CloudFormation template for HA setup
Resources:
  ProductionDB:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: train-tracker-db-prod
      Engine: postgres
      MultiAZ: true  # Automatic failover to standby
      BackupRetentionPeriod: 30
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "sun:04:00-sun:05:00"

  ReadReplica1:
    Type: AWS::RDS::DBInstance
    Properties:
      SourceDBInstanceIdentifier: !Ref ProductionDB
      DBInstanceIdentifier: train-tracker-db-read-1
      AvailabilityZone: us-east-1b

  ReadReplica2:
    Type: AWS::RDS::DBInstance
    Properties:
      SourceDBInstanceIdentifier: !Ref ProductionDB
      DBInstanceIdentifier: train-tracker-db-read-2
      AvailabilityZone: us-east-1c
```

### 4. Azure Zone-Redundant Configuration

```bash
# Create zone-redundant server
az postgres flexible-server create \
    --name train-tracker-db-prod \
    --resource-group train-tracker-rg \
    --location eastus \
    --admin-user pgadmin \
    --admin-password $ADMIN_PASSWORD \
    --sku-name Standard_D2s_v3 \
    --tier GeneralPurpose \
    --storage-size 128 \
    --version 15 \
    --high-availability ZoneRedundant \
    --backup-retention 30 \
    --geo-redundant-backup Enabled
```

### 5. Disaster Recovery Runbook

**Scenario: Primary Database Failure**

```bash
#!/bin/bash
# dr-runbook/primary-db-failure.sh

echo "=== DISASTER RECOVERY RUNBOOK ==="
echo "Scenario: Primary Database Failure"
echo "=================================="

# Step 1: Verify failure
echo "1. Verifying database connectivity..."
if pg_isready -h $PRIMARY_DB_HOST; then
    echo "   ✓ Primary database is responding"
    exit 0
else
    echo "   ✗ Primary database is NOT responding"
fi

# Step 2: Check read replicas
echo "2. Checking read replica status..."
if pg_isready -h $REPLICA_DB_HOST; then
    echo "   ✓ Replica is healthy"
else
    echo "   ✗ Replica is also down - CRITICAL"
    exit 1
fi

# Step 3: Promote replica (AWS)
echo "3. Promoting read replica to primary..."
aws rds promote-read-replica \
    --db-instance-identifier train-tracker-db-read-1 \
    --backup-retention-period 30 \
    --region us-east-1

# Wait for promotion
aws rds wait db-instance-available \
    --db-instance-identifier train-tracker-db-read-1

echo "   ✓ Replica promoted successfully"

# Step 4: Update DNS/connection strings
echo "4. Updating application connection strings..."
# Update SSM Parameter Store / environment variables
aws ssm put-parameter \
    --name /traintracker/prod/database-url \
    --value "postgresql://postgres:$DB_PASSWORD@train-tracker-db-read-1.xxxxx.us-east-1.rds.amazonaws.com:5432/traintracker" \
    --overwrite

echo "   ✓ Connection strings updated"

# Step 5: Verify application connectivity
echo "5. Verifying application connectivity..."
node scripts/verify-db-connection.js

echo "   ✓ Application connected to new primary"

# Step 6: Notify team
echo "6. Sending incident notification..."
# Send to Slack/PagerDuty/Email
curl -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d '{
      "text": "🚨 DR Event: Primary database failed. Promoted replica to primary. RTO: '"$(date +%M)"' minutes"
    }'

echo "=== DISASTER RECOVERY COMPLETED ==="
echo "Next steps:"
echo "  1. Investigate root cause of primary failure"
echo "  2. Create new read replica from promoted instance"
echo "  3. Document incident in postmortem"
```

---

## Backup Testing & Validation

### 1. Monthly Backup Test Plan

```bash
#!/bin/bash
# scripts/test-backup-restore.sh

set -e

echo "=== BACKUP RESTORE TEST ==="
echo "Date: $(date)"
echo "=========================="

# Configuration
TEST_DB_NAME="traintracker_restore_test"
LATEST_BACKUP=$(ls -t backups/manual/*.backup.gz | head -1)

echo "1. Found backup: $LATEST_BACKUP"

# Create test database
echo "2. Creating test database..."
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS $TEST_DB_NAME;"
psql -h localhost -U postgres -c "CREATE DATABASE $TEST_DB_NAME;"

# Restore backup
echo "3. Restoring backup..."
gunzip -c $LATEST_BACKUP | pg_restore -h localhost -U postgres -d $TEST_DB_NAME -v

# Verify restore
echo "4. Verifying restore..."

# Check table counts
EXPECTED_TABLES=$(psql -h $PRIMARY_DB_HOST -U postgres -d traintracker -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
RESTORED_TABLES=$(psql -h localhost -U postgres -d $TEST_DB_NAME -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

if [ "$EXPECTED_TABLES" -eq "$RESTORED_TABLES" ]; then
    echo "   ✓ Table count matches: $RESTORED_TABLES"
else
    echo "   ✗ Table count mismatch: Expected $EXPECTED_TABLES, got $RESTORED_TABLES"
    exit 1
fi

# Check record counts
for table in users trains bookings; do
    EXPECTED_COUNT=$(psql -h $PRIMARY_DB_HOST -U postgres -d traintracker -tc "SELECT COUNT(*) FROM $table;")
    RESTORED_COUNT=$(psql -h localhost -U postgres -d $TEST_DB_NAME -tc "SELECT COUNT(*) FROM $table;")
    
    echo "   $table: Expected $EXPECTED_COUNT, Restored $RESTORED_COUNT"
done

# Cleanup
echo "5. Cleaning up test database..."
psql -h localhost -U postgres -c "DROP DATABASE $TEST_DB_NAME;"

echo "=== BACKUP TEST COMPLETED SUCCESSFULLY ==="

# Log results
echo "$(date): Backup test successful - $LATEST_BACKUP" >> backups/test-log.txt
```

### 2. PITR Test

```bash
# Test point-in-time recovery monthly
#!/bin/bash
# scripts/test-pitr.sh

# 1. Take note of current time
CURRENT_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
echo "Current time: $CURRENT_TIME"

# 2. Insert test record
psql -h $DB_HOST -U postgres -d traintracker -c "
INSERT INTO recovery_test (test_time, description) 
VALUES (NOW(), 'PITR test record');
"

# 3. Delete test record (simulating data loss)
sleep 60
psql -h $DB_HOST -U postgres -d traintracker -c "
DELETE FROM recovery_test WHERE description = 'PITR test record';
"

# 4. Perform PITR to before deletion
aws rds restore-db-instance-to-point-in-time \
    --source-db-instance-identifier train-tracker-db-prod \
    --target-db-instance-identifier train-tracker-pitr-test \
    --restore-time $CURRENT_TIME

# 5. Verify record exists in restored instance
# (After restore completes)
RECOVERED_RECORD=$(psql -h train-tracker-pitr-test.xxxxx.rds.amazonaws.com -U postgres -d traintracker -tc "
SELECT COUNT(*) FROM recovery_test WHERE description = 'PITR test record';
")

if [ "$RECOVERED_RECORD" -eq "1" ]; then
    echo "✓ PITR test successful"
else
    echo "✗ PITR test failed"
fi

# 6. Cleanup
aws rds delete-db-instance \
    --db-instance-identifier train-tracker-pitr-test \
    --skip-final-snapshot
```

---

## Restore Procedures

### 1. Full Database Restore (pg_restore)

```bash
# Restore from custom format backup
pg_restore -h localhost -U postgres \
    -d traintracker \
    -v \
    backups/traintracker-20240115-120000.backup

# Parallel restore (faster)
pg_restore -h localhost -U postgres \
    -d traintracker \
    -j 4 \
    -v \
    backups/traintracker-20240115-120000

# Clean database before restore
pg_restore -h localhost -U postgres \
    -d traintracker \
    -c \
    -v \
    backups/traintracker-20240115-120000.backup
```

### 2. Selective Restore

```bash
# Restore only specific tables
pg_restore -h localhost -U postgres \
    -d traintracker \
    -t users -t bookings \
    -v \
    backups/traintracker-20240115-120000.backup

# Restore only schema
pg_restore -h localhost -U postgres \
    -d traintracker \
    --schema-only \
    -v \
    backups/traintracker-20240115-120000.backup

# Restore only data
pg_restore -h localhost -U postgres \
    -d traintracker \
    --data-only \
    -v \
    backups/traintracker-20240115-120000.backup
```

### 3. AWS RDS Snapshot Restore

```bash
# Restore from automated backup
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier train-tracker-db-restored \
    --db-snapshot-identifier train-tracker-snapshot-20240115-120000 \
    --db-instance-class db.t3.medium \
    --publicly-accessible \
    --region us-east-1

# Monitor restore progress
aws rds describe-db-instances \
    --db-instance-identifier train-tracker-db-restored \
    --query 'DBInstances[0].[DBInstanceStatus,PercentProgress]' \
    --output table
```

### 4. Azure PostgreSQL Restore

```bash
# Restore from automated backup
az postgres flexible-server restore \
    --name train-tracker-db-restored \
    --resource-group train-tracker-rg \
    --source-server train-tracker-db-prod \
    --restore-time "2024-01-15T10:30:00Z"

# Check restore status
az postgres flexible-server show \
    --name train-tracker-db-restored \
    --resource-group train-tracker-rg \
    --query 'state' \
    --output tsv
```

---

## Backup Automation Scripts

### 1. Cron Job Configuration

```bash
# Edit crontab
crontab -e

# Add backup jobs
# Daily backup at 3 AM
0 3 * * * /path/to/train-tracker/scripts/manual-backup.sh >> /var/log/traintracker/backup.log 2>&1

# Weekly full backup on Sunday at 2 AM
0 2 * * 0 /path/to/train-tracker/scripts/weekly-full-backup.sh >> /var/log/traintracker/weekly-backup.log 2>&1

# Monthly backup test on 1st of month at 4 AM
0 4 1 * * /path/to/train-tracker/scripts/test-backup-restore.sh >> /var/log/traintracker/backup-test.log 2>&1
```

### 2. GitHub Actions Backup Workflow

```yaml
# .github/workflows/database-backup.yml
name: Database Backup

on:
  schedule:
    - cron: '0 3 * * *'  # Daily at 3 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup PostgreSQL client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client
      
      - name: Create backup
        env:
          DB_HOST: ${{ secrets.DB_HOST }}
          DB_USER: ${{ secrets.DB_USER }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
          DB_NAME: traintracker
        run: |
          BACKUP_FILE="traintracker-$(date +%Y%m%d-%H%M%S).backup"
          PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F c -f $BACKUP_FILE
          gzip $BACKUP_FILE
      
      - name: Upload to AWS S3
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
        run: |
          aws s3 cp *.backup.gz s3://train-tracker-backups/automated/$(date +%Y/%m)/
      
      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: '🚨 Database backup failed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 3. Monitoring & Alerts

```javascript
// scripts/backup-monitor.js
const { Client } = require('pg');
const axios = require('axios');

async function checkBackupHealth() {
  const checks = {
    lastBackupTime: null,
    backupSize: null,
    status: 'unknown'
  };

  try {
    // Check AWS RDS automated backup
    const { execSync } = require('child_process');
    const output = execSync('aws rds describe-db-instances --db-instance-identifier train-tracker-db-prod --query "DBInstances[0].{Latest:LatestRestorableTime}"').toString();
    const data = JSON.parse(output);
    
    checks.lastBackupTime = new Date(data.Latest);
    const hoursSinceBackup = (new Date() - checks.lastBackupTime) / (1000 * 60 * 60);
    
    if (hoursSinceBackup > 25) {
      checks.status = 'critical';
      await sendAlert('🚨 CRITICAL: No backup in 25+ hours!');
    } else if (hoursSinceBackup > 12) {
      checks.status = 'warning';
      await sendAlert('⚠️ WARNING: No backup in 12+ hours');
    } else {
      checks.status = 'healthy';
    }
    
    console.log('Backup health check:', checks);
    
  } catch (error) {
    console.error('Backup health check failed:', error);
    await sendAlert('🚨 ERROR: Backup monitoring failed!');
  }
}

async function sendAlert(message) {
  if (process.env.SLACK_WEBHOOK_URL) {
    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      text: message,
      channel: '#database-alerts'
    });
  }
}

// Run check
checkBackupHealth();
```

---

## Cost Optimization

### 1. AWS RDS Backup Costs

| Storage Type | Cost | Recommendation |
|--------------|------|----------------|
| **Automated Backups** | Free up to DB size | Keep 7-30 days |
| **Manual Snapshots** | $0.095/GB-month | Delete after verification |
| **S3 Export** | $0.023/GB-month | For long-term archival (>1 year) |
| **Cross-Region Copy** | $0.02/GB transfer | Only for DR requirements |

**Cost Optimization Strategies:**

```bash
# 1. Delete old manual snapshots
aws rds describe-db-snapshots \
    --db-instance-identifier train-tracker-db-prod \
    --query 'DBSnapshots[?SnapshotCreateTime<`2023-01-01`].DBSnapshotIdentifier' \
    --output text | while read snapshot; do
    aws rds delete-db-snapshot --db-snapshot-identifier $snapshot
done

# 2. Export to S3 and delete snapshot
aws rds start-export-task \
    --export-task-identifier export-$(date +%Y%m%d) \
    --source-arn arn:aws:rds:us-east-1:ACCOUNT:snapshot:old-snapshot \
    --s3-bucket-name long-term-backups \
    --iam-role-arn arn:aws:iam::ACCOUNT:role/rds-s3-export

# After export completes, delete snapshot
aws rds delete-db-snapshot --db-snapshot-identifier old-snapshot
```

### 2. Azure PostgreSQL Backup Costs

| Feature | Cost | Recommendation |
|---------|------|----------------|
| **Local Backups** | Free up to 100% provisioned storage | Use 7-35 days retention |
| **Geo-Redundant** | Same as LRS pricing | Enable for production only |
| **Blob Storage (Manual)** | $0.018/GB-month (Hot), $0.01/GB-month (Cool) | Use lifecycle policies |

**Lifecycle Policy for Cost Savings:**

```json
{
  "rules": [
    {
      "enabled": true,
      "name": "backup-lifecycle",
      "type": "Lifecycle",
      "definition": {
        "actions": {
          "baseBlob": {
            "tierToCool": {
              "daysAfterModificationGreaterThan": 30
            },
            "tierToArchive": {
              "daysAfterModificationGreaterThan": 90
            },
            "delete": {
              "daysAfterModificationGreaterThan": 365
            }
          }
        }
      }
    }
  ]
}
```

### 3. Backup Retention Recommendations

| Environment | Retention | Cost Impact |
|-------------|-----------|-------------|
| **Development** | 7 days | Minimal |
| **Staging** | 14 days | Low |
| **Production** | 30 days | Medium |
| **Compliance** | 7 years | High (use S3 Glacier) |

---

## Summary Checklist

### ✅ Daily Tasks
- [ ] Verify automated backup completed successfully
- [ ] Check backup logs for errors
- [ ] Monitor backup storage usage

### ✅ Weekly Tasks
- [ ] Review backup retention policies
- [ ] Delete unnecessary manual snapshots
- [ ] Test restore on development environment

### ✅ Monthly Tasks
- [ ] Perform full backup restore test
- [ ] Test PITR functionality
- [ ] Review and optimize backup costs
- [ ] Update disaster recovery runbook

### ✅ Quarterly Tasks
- [ ] Conduct DR drill (full failover test)
- [ ] Review RTO/RPO targets vs actual
- [ ] Update backup documentation
- [ ] Audit backup access controls

---

## Quick Reference

### Backup Commands

```bash
# Manual backup
pg_dump -h $DB_HOST -U postgres -d traintracker -F c -f backup.backup

# AWS snapshot
aws rds create-db-snapshot --db-instance-identifier DB_ID --db-snapshot-identifier SNAPSHOT_ID

# Azure backup (via pg_dump)
pg_dump -h DB.postgres.database.azure.com -U user@DB -d traintracker -F c -f backup.backup

# Restore
pg_restore -h localhost -U postgres -d traintracker backup.backup
```

### Emergency Contacts

- **Primary DBA**: [Contact info]
- **AWS Support**: 1-800-xxx-xxxx (Enterprise Support)
- **Azure Support**: [Azure Portal > Help + Support]
- **On-Call Engineer**: [PagerDuty/Opsgenie rotation]

---

**Document Version**: 1.0  
**Last Updated**: January 2024  
**Next Review**: April 2024  
**Owner**: DevOps Team
