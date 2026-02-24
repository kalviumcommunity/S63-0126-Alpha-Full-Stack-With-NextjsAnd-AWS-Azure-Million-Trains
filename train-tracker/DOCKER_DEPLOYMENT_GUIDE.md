# Docker Deployment Guide

## Overview

This guide walks through deploying the Train Tracker Next.js application to **AWS Elastic Container Service (ECS)** or **Azure App Service** using Docker containers. Both platforms provide auto-scaling, health monitoring, and seamless CI/CD integration.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Docker Testing](#local-docker-testing)
3. [AWS ECS Deployment](#aws-ecs-deployment)
4. [Azure App Service Deployment](#azure-app-service-deployment)
5. [CI/CD with GitHub Actions](#cicd-with-github-actions)
6. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
7. [Cost Optimization](#cost-optimization)

---

## Prerequisites

### General Requirements
- Docker Desktop installed and running
- Git repository with GitHub Actions enabled
- Domain name (optional, for custom DNS)

### AWS Requirements
- AWS account with billing enabled
- AWS CLI installed: `aws --version`
- IAM user with programmatic access (for GitHub Actions)
- Permissions: ECS, ECR, Secrets Manager, CloudWatch, IAM

### Azure Requirements
- Azure subscription
- Azure CLI installed: `az --version`
- Logged in: `az login`
- Permissions: App Service, Container Registry, Key Vault, Storage

---

## Local Docker Testing

### 1. Build Docker Image

```bash
cd train-tracker
docker build -t train-tracker:latest .
```

**Build time**: ~5-10 minutes (first build), ~2-3 minutes (cached builds)

### 2. Run Container Locally

```bash
# Create .env.local with required variables
cp .env.example .env.local

# Run container
docker run -p 3000:3000 \
  --env-file .env.local \
  train-tracker:latest
```

**Access**: http://localhost:3000

### 3. Test with Docker Compose

```bash
# Start all services (app + PostgreSQL + Redis)
docker compose up --build

# Run in detached mode
docker compose up -d

# View logs
docker compose logs -f app

# Stop services
docker compose down
```

**Docker Compose includes**:
- Next.js app (port 3000)
- PostgreSQL 15 (port 5432)
- Redis 7 (port 6379)

### 4. Verify Health Endpoint

```bash
curl http://localhost:3000/api/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "version": "1.0.0"
}
```

---

## AWS ECS Deployment

### Step 1: Configure AWS Resources

Run the automated setup script:

```bash
cd scripts
chmod +x setup-aws-ecs.sh
./setup-aws-ecs.sh
```

**This script creates**:
- ECR repository for Docker images
- ECS cluster with Fargate support
- CloudWatch log group
- IAM roles (task execution + task role)

**Manual setup alternative**: See [Manual AWS Setup](#manual-aws-setup) below.

### Step 2: Build and Push Image to ECR

```bash
# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="us-east-1"
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/train-tracker"

# Authenticate Docker to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_URI

# Build and tag image
docker build -t train-tracker:latest .
docker tag train-tracker:latest ${ECR_URI}:latest
docker tag train-tracker:latest ${ECR_URI}:$(git rev-parse --short HEAD)

# Push to ECR
docker push ${ECR_URI}:latest
docker push ${ECR_URI}:$(git rev-parse --short HEAD)
```

### Step 3: Configure Secrets Manager

```bash
# Create secret JSON file
cat > /tmp/app-secrets.json <<EOF
{
  "DATABASE_URL": "postgresql://user:pass@host:5432/traintracker",
  "JWT_SECRET": "your-jwt-secret",
  "JWT_REFRESH_SECRET": "your-refresh-secret",
  "AWS_S3_BUCKET": "train-tracker-uploads",
  "RAPIDAPI_KEY": "your-rapidapi-key"
}
EOF

# Create secret in Secrets Manager
aws secretsmanager create-secret \
  --name train-tracker/app-secrets \
  --secret-string file:///tmp/app-secrets.json \
  --region us-east-1

# Clean up
rm /tmp/app-secrets.json
```

### Step 4: Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name train-tracker-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx \
  --scheme internet-facing \
  --type application

# Create target group
aws elbv2 create-target-group \
  --name train-tracker-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-path /api/health \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=<tg-arn>
```

### Step 5: Register Task Definition

```bash
# Update task definition with your values
sed -i \
  -e "s/YOUR_ACCOUNT_ID/${AWS_ACCOUNT_ID}/g" \
  -e "s/us-east-1/${AWS_REGION}/g" \
  ecs-task-definition.json

# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json
```

### Step 6: Create ECS Service

```bash
aws ecs create-service \
  --cluster train-tracker-cluster \
  --service-name train-tracker-service \
  --task-definition train-tracker-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[subnet-xxx,subnet-yyy],
    securityGroups=[sg-xxx],
    assignPublicIp=ENABLED
  }" \
  --load-balancers "
    targetGroupArn=<tg-arn>,
    containerName=train-tracker-app,
    containerPort=3000
  " \
  --health-check-grace-period-seconds 60
```

### Step 7: Configure Auto-Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/train-tracker-cluster/train-tracker-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create CPU-based scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/train-tracker-cluster/train-tracker-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'
```

---

## Azure App Service Deployment

### Step 1: Configure Azure Resources

Run the automated setup script:

```bash
cd scripts
chmod +x setup-azure-app-service.sh
./setup-azure-app-service.sh
```

**This script creates**:
- Resource group
- Azure Container Registry
- Key Vault for secrets
- Storage account with blob container
- App Service Plan (Linux + Docker)
- Web App with managed identity
- Service Principal for GitHub Actions

### Step 2: Build and Push Image to ACR

```bash
ACR_NAME="traintracker"
PROJECT_NAME="train-tracker"

# Login to ACR
az acr login --name $ACR_NAME

# Build and push
docker build -t ${PROJECT_NAME}:latest .
docker tag ${PROJECT_NAME}:latest ${ACR_NAME}.azurecr.io/${PROJECT_NAME}:latest
docker push ${ACR_NAME}.azurecr.io/${PROJECT_NAME}:latest
```

### Step 3: Configure Key Vault Secrets

```bash
VAULT_NAME="train-tracker-kv"

# Add secrets (use hyphens instead of underscores for Azure)
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name DATABASE-URL \
  --value "postgresql://user:pass@host:5432/traintracker"

az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name JWT-SECRET \
  --value "your-jwt-secret"

az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name JWT-REFRESH-SECRET \
  --value "your-refresh-secret"

az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name RAPIDAPI-KEY \
  --value "your-rapidapi-key"
```

### Step 4: Update App Settings

```bash
APP_NAME="train-tracker-app"
RESOURCE_GROUP="train-tracker-rg"

az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    CLOUD_SECRET_KEYS="DATABASE-URL,JWT-SECRET,JWT-REFRESH-SECRET,RAPIDAPI-KEY"
```

### Step 5: Deploy Container

```bash
az webapp config container set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name ${ACR_NAME}.azurecr.io/${PROJECT_NAME}:latest

# Restart to apply changes
az webapp restart \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP
```

### Step 6: Configure Auto-Scaling

```bash
az monitor autoscale create \
  --resource-group $RESOURCE_GROUP \
  --resource $APP_NAME \
  --resource-type Microsoft.Web/serverFarms \
  --name ${APP_NAME}-autoscale \
  --min-count 1 \
  --max-count 5 \
  --count 2

# Add CPU rule
az monitor autoscale rule create \
  --resource-group $RESOURCE_GROUP \
  --autoscale-name ${APP_NAME}-autoscale \
  --condition "CpuPercentage > 70 avg 5m" \
  --scale out 1

az monitor autoscale rule create \
  --resource-group $RESOURCE_GROUP \
  --autoscale-name ${APP_NAME}-autoscale \
  --condition "CpuPercentage < 30 avg 5m" \
  --scale in 1
```

---

## CI/CD with GitHub Actions

### AWS ECS Workflow

**File**: `.github/workflows/deploy-aws-ecs.yml`

**Required GitHub Secrets**:
1. Go to repository **Settings → Secrets and variables → Actions**
2. Add secrets:
   - `AWS_ACCESS_KEY_ID` - IAM user access key
   - `AWS_SECRET_ACCESS_KEY` - IAM user secret key

**Workflow triggers**:
- Push to `main` or `production` branch
- Manual dispatch (Actions tab → Run workflow)

**Deployment process**:
1. Checkout code
2. Configure AWS credentials
3. Build Docker image
4. Push to ECR with git SHA tag
5. Update ECS task definition
6. Deploy to ECS service (rolling update)
7. Wait for service stability

### Azure App Service Workflow

**File**: `.github/workflows/deploy-azure-app-service.yml`

**Required GitHub Secrets**:
1. Create Service Principal (done by setup script):
   ```bash
   az ad sp create-for-rbac \
     --name "train-tracker-github-actions" \
     --role Contributor \
     --scopes /subscriptions/{subscription-id}/resourceGroups/train-tracker-rg \
     --sdk-auth
   ```

2. Add secrets to GitHub:
   - `AZURE_CREDENTIALS` - Service Principal JSON (from script output)
   - `AZURE_ACR_USERNAME` - ACR username
   - `AZURE_ACR_PASSWORD` - ACR password

**Deployment process**:
1. Checkout code
2. Login to ACR
3. Build and push Docker image
4. Azure login with Service Principal
5. Deploy to Web App
6. Update health check configuration
7. Verify deployment health

---

## Monitoring & Troubleshooting

### AWS CloudWatch

**View logs**:
```bash
# Tail logs
aws logs tail /ecs/train-tracker --follow

# Filter errors
aws logs filter-log-events \
  --log-group-name /ecs/train-tracker \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '1 hour ago' +%s)000

# View specific task logs
aws logs get-log-events \
  --log-group-name /ecs/train-tracker \
  --log-stream-name ecs/train-tracker-app/<task-id>
```

**Common issues**:

| Issue | Cause | Solution |
|-------|-------|----------|
| Task fails immediately | Missing secrets | Check Secrets Manager ARNs in task definition |
| Health check fails | App not listening on port 3000 | Verify `PORT=3000` environment variable |
| Cannot pull image | ECR permissions | Ensure task execution role has `ecr:GetAuthorizationToken` |
| Out of memory | Insufficient task memory | Increase memory in task definition (1024 → 2048 MB) |

### Azure Application Insights

**View logs**:
```bash
# Stream logs
az webapp log tail \
  --name train-tracker-app \
  --resource-group train-tracker-rg

# Download logs
az webapp log download \
  --name train-tracker-app \
  --resource-group train-tracker-rg \
  --log-file webapp-logs.zip
```

**Common issues**:

| Issue | Cause | Solution |
|-------|-------|----------|
| Container crashes | Missing environment variable | Check App Settings in portal |
| Key Vault access denied | Managed identity not granted | Run `az keyvault set-policy` command |
| Slow startup | Cold start | Enable Always On in App Service configuration |
| 502 Bad Gateway | App not responding on port | Verify `WEBSITES_PORT=3000` is set |

---

## Cost Optimization

### AWS ECS Pricing

**Fargate pricing** (us-east-1):
- vCPU: $0.04048/hour
- Memory: $0.004445/GB/hour

**Example configurations**:

| Environment | vCPU | Memory | Tasks | Monthly Cost |
|-------------|------|--------|-------|--------------|
| Development | 0.25 | 0.5 GB | 1 | ~$11 |
| Staging | 0.5 | 1 GB | 1 | ~$33 |
| Production | 1.0 | 2 GB | 2 | ~$178 |

**Cost savings**:
- Use Fargate Spot for non-critical workloads (70% discount)
- Implement scheduled scaling (scale down at night)
- Set CloudWatch Logs retention (7 days dev, 30 days prod)

### Azure App Service Pricing

**App Service Plan pricing**:

| Tier | Specs | Monthly Cost | Use Case |
|------|-------|--------------|----------|
| B1 | 1 Core, 1.75 GB | $13 | Development |
| B2 | 2 Cores, 3.5 GB | $25 | Staging |
| P1V2 | 1 Core, 3.5 GB | $73 | Production (small) |
| P2V2 | 2 Cores, 7 GB | $146 | Production (medium) |

**Cost savings**:
- Use deployment slots for blue/green deployments (no extra cost)
- Enable auto-shutdown for dev environments
- Scale down during off-hours with Azure Automation

---

## Security Checklist

**Before production deployment**:

- [ ] All secrets stored in Secrets Manager/Key Vault (not in code)
- [ ] HTTPS enforced with valid SSL certificate
- [ ] Database uses connection pooling and SSL
- [ ] Container runs as non-root user
- [ ] Health check endpoint returns 200 OK
- [ ] Auto-scaling configured with appropriate limits
- [ ] CloudWatch/Application Insights monitoring enabled
- [ ] IAM/RBAC follows least privilege principle
- [ ] Container image vulnerability scanning enabled
- [ ] Backup strategy implemented for database
- [ ] Disaster recovery plan documented

---

## Additional Resources

- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)

---

## Support

For issues or questions:
1. Check [troubleshooting section](#monitoring--troubleshooting)
2. Review CloudWatch/Application Insights logs
3. Test locally with Docker Compose
4. Verify all environment variables are set correctly
