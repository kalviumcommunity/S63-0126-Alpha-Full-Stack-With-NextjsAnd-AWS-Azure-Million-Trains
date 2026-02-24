# Docker Deployment Quick Reference

## 📦 Files Created

### Docker Configuration
- `Dockerfile` - Multi-stage production build (deps → builder → runner)
- `.dockerignore` - Exclude unnecessary files from image
- `docker-compose.yml` - Local development with PostgreSQL + Redis + App

### AWS ECS Deployment
- `ecs-task-definition.json` - Fargate task configuration (512 CPU / 1GB RAM)
- `.github/workflows/deploy-aws-ecs.yml` - GitHub Actions CI/CD pipeline
- `scripts/setup-aws-ecs.sh` - Automated AWS resource setup

### Azure App Service Deployment
- `azure-app-service-template.json` - ARM template for App Service
- `.github/workflows/deploy-azure-app-service.yml` - GitHub Actions CI/CD pipeline
- `scripts/setup-azure-app-service.sh` - Automated Azure resource setup

### Application
- `app/api/health/route.ts` - Health check endpoint for load balancers
- `next.config.mjs` - Updated with `output: 'standalone'` for Docker
- `.env.example` - Updated with Docker/deployment variables

### Documentation
- `DOCKER_DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide

---

## ⚡ Quick Commands

### Local Development

```bash
# Build image
docker build -t train-tracker .

# Run with Docker Compose
docker compose up --build

# Stop services
docker compose down
```

### AWS ECS

```bash
# Setup AWS resources
cd scripts && chmod +x setup-aws-ecs.sh && ./setup-aws-ecs.sh

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ECR_URI>
docker build -t train-tracker .
docker tag train-tracker:latest <ECR_URI>:latest
docker push <ECR_URI>:latest

# Deploy via GitHub Actions (push to main branch)
git push origin main
```

### Azure App Service

```bash
# Setup Azure resources
cd scripts && chmod +x setup-azure-app-service.sh && ./setup-azure-app-service.sh

# Push to ACR
az acr login --name traintracker
docker build -t train-tracker .
docker tag train-tracker:latest traintracker.azurecr.io/train-tracker:latest
docker push traintracker.azurecr.io/train-tracker:latest

# Deploy via GitHub Actions (push to main branch)
git push origin main
```

---

## 🔐 Required Secrets

### GitHub Secrets (AWS)
```
AWS_ACCESS_KEY_ID          -> IAM user access key
AWS_SECRET_ACCESS_KEY      -> IAM user secret key
```

### GitHub Secrets (Azure)
```
AZURE_CREDENTIALS          -> Service Principal JSON
AZURE_ACR_USERNAME         -> Container Registry username
AZURE_ACR_PASSWORD         -> Container Registry password
```

### AWS Secrets Manager
```json
{
  "DATABASE_URL": "postgresql://...",
  "JWT_SECRET": "...",
  "JWT_REFRESH_SECRET": "...",
  "AWS_S3_BUCKET": "train-tracker-uploads",
  "RAPIDAPI_KEY": "..."
}
```

### Azure Key Vault (use hyphens)
```bash
DATABASE-URL
JWT-SECRET
JWT-REFRESH-SECRET
AZURE-STORAGE-ACCOUNT-NAME
RAPIDAPI-KEY
```

---

## 🏗️ Architecture

### AWS ECS Stack
```
GitHub Actions → ECR → ECS Fargate → ALB → Internet
                  ↓
           Secrets Manager
                  ↓
              RDS PostgreSQL
```

### Azure App Service Stack
```
GitHub Actions → ACR → App Service → Internet
                  ↓
              Key Vault
                  ↓
         Azure PostgreSQL
```

---

## 🩺 Health Check

**Endpoint**: `/api/health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0"
}
```

**Optional checks** (set env vars):
- `ENABLE_HEALTH_DB_CHECK=true` - Database connectivity
- `ENABLE_HEALTH_REDIS_CHECK=true` - Redis connectivity

---

## 🔧 Environment Variables

### Required
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

### Cloud Provider
```bash
# AWS
SECRET_PROVIDER=aws
AWS_SECRET_ARN=arn:aws:secretsmanager:...
STORAGE_PROVIDER=aws
AWS_S3_BUCKET=train-tracker-uploads

# Azure
SECRET_PROVIDER=azure
AZURE_KEY_VAULT_NAME=train-tracker-kv
STORAGE_PROVIDER=azure
AZURE_STORAGE_ACCOUNT_NAME=traintracker
CLOUD_SECRET_KEYS=DATABASE-URL,JWT-SECRET,...
```

---

## 📊 Monitoring

### AWS CloudWatch
```bash
# Tail logs
aws logs tail /ecs/train-tracker --follow

# Filter errors
aws logs filter-log-events \
  --log-group-name /ecs/train-tracker \
  --filter-pattern "ERROR"
```

### Azure App Insights
```bash
# Stream logs
az webapp log tail \
  --name train-tracker-app \
  --resource-group train-tracker-rg

# Download logs
az webapp log download \
  --name train-tracker-app \
  --resource-group train-tracker-rg
```

---

## 🚨 Troubleshooting

### Container won't start
1. Check CloudWatch/App Service logs
2. Verify all secrets are set
3. Test locally: `docker run -p 3000:3000 train-tracker`
4. Check health endpoint: `curl http://localhost:3000/api/health`

### Health check fails
1. Verify PORT=3000 environment variable
2. Check security groups allow traffic on port 3000
3. Increase health check grace period
4. Review application logs for startup errors

### Secret retrieval fails
- **AWS**: Check IAM role has `secretsmanager:GetSecretValue`
- **Azure**: Check managed identity has Key Vault access
- Verify secret ARNs/names are correct
- Check network connectivity to secret service

---

## 💰 Cost Estimates

### AWS ECS (Production)
- Fargate: 1 vCPU, 2GB RAM, 2 tasks = ~$178/month
- ALB: ~$16/month
- CloudWatch Logs: ~$5/month (7-day retention)
- **Total**: ~$200/month

### Azure App Service (Production)
- P1V2: 1 core, 3.5GB RAM = ~$73/month
- Container Registry: ~$5/month
- **Total**: ~$80/month

---

## 📚 Documentation

- Full deployment guide: [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md)
- Main README: [Readme.md](../Readme.md) - Section "Deployment with Docker on AWS ECS / Azure App Service"
- AWS setup script: [scripts/setup-aws-ecs.sh](scripts/setup-aws-ecs.sh)
- Azure setup script: [scripts/setup-azure-app-service.sh](scripts/setup-azure-app-service.sh)

---

## ✅ Pre-Deployment Checklist

- [ ] Local Docker build successful
- [ ] All secrets configured in Secrets Manager/Key Vault
- [ ] GitHub Actions secrets added
- [ ] Database accessible from cloud environment
- [ ] Health endpoint returns 200 OK
- [ ] Auto-scaling configured
- [ ] Monitoring enabled (CloudWatch/App Insights)
- [ ] SSL/TLS certificate configured (if using custom domain)
- [ ] Backup strategy in place
- [ ] Disaster recovery plan documented

---

## 🎯 Next Steps After Deployment

1. **Set up custom domain**: Configure Route 53 (AWS) or DNS Zone (Azure)
2. **Enable SSL**: Use AWS Certificate Manager or App Service Managed Certificate
3. **Configure CI/CD**: Automate deployments on push to main branch
4. **Set up monitoring**: CloudWatch alarms or Azure Monitor alerts
5. **Implement logging**: Centralized logging with CloudWatch Insights or Log Analytics
6. **Configure backups**: Automated database backups and snapshots
7. **Security hardening**: WAF rules, DDoS protection, vulnerability scanning

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0
