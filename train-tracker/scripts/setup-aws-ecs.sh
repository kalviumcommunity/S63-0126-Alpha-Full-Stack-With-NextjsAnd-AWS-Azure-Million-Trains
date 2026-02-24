#!/bin/bash
# =============================================================================
# AWS ECS Deployment Setup Script
# =============================================================================
# This script helps configure AWS resources for Train Tracker deployment
# Prerequisites: AWS CLI installed and configured with appropriate credentials
# =============================================================================

set -e  # Exit on error

echo "🚀 AWS ECS Deployment Setup for Train Tracker"
echo "=============================================="
echo ""

# Configuration variables
PROJECT_NAME="train-tracker"
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPOSITORY="${PROJECT_NAME}"
ECS_CLUSTER="${PROJECT_NAME}-cluster"
ECS_SERVICE="${PROJECT_NAME}-service"
ECS_TASK_FAMILY="${PROJECT_NAME}-task"
LOG_GROUP="/ecs/${PROJECT_NAME}"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not found. Please install it first."
    exit 1
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
print_success "AWS Account ID: $AWS_ACCOUNT_ID"
print_success "Region: $AWS_REGION"
echo ""

# Step 1: Create ECR Repository
echo "📦 Step 1: Creating ECR Repository..."
if aws ecr describe-repositories --repository-names "$ECR_REPOSITORY" --region "$AWS_REGION" &> /dev/null; then
    print_info "ECR repository '$ECR_REPOSITORY' already exists"
else
    aws ecr create-repository \
        --repository-name "$ECR_REPOSITORY" \
        --region "$AWS_REGION" \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256 &> /dev/null
    print_success "ECR repository created: $ECR_REPOSITORY"
fi
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}"
echo ""

# Step 2: Create ECS Cluster
echo "🎯 Step 2: Creating ECS Cluster..."
if aws ecs describe-clusters --clusters "$ECS_CLUSTER" --region "$AWS_REGION" | grep -q "ACTIVE"; then
    print_info "ECS cluster '$ECS_CLUSTER' already exists"
else
    aws ecs create-cluster \
        --cluster-name "$ECS_CLUSTER" \
        --region "$AWS_REGION" \
        --capacity-providers FARGATE FARGATE_SPOT \
        --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 &> /dev/null
    print_success "ECS cluster created: $ECS_CLUSTER"
fi
echo ""

# Step 3: Create CloudWatch Log Group
echo "📊 Step 3: Creating CloudWatch Log Group..."
if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --region "$AWS_REGION" | grep -q "$LOG_GROUP"; then
    print_info "CloudWatch log group '$LOG_GROUP' already exists"
else
    aws logs create-log-group \
        --log-group-name "$LOG_GROUP" \
        --region "$AWS_REGION" &> /dev/null
    aws logs put-retention-policy \
        --log-group-name "$LOG_GROUP" \
        --retention-in-days 7 \
        --region "$AWS_REGION" &> /dev/null
    print_success "CloudWatch log group created: $LOG_GROUP"
fi
echo ""

# Step 4: Create IAM Roles
echo "🔐 Step 4: Creating IAM Roles..."

# ECS Task Execution Role
EXECUTION_ROLE_NAME="ecsTaskExecutionRole-${PROJECT_NAME}"
if aws iam get-role --role-name "$EXECUTION_ROLE_NAME" &> /dev/null; then
    print_info "Task execution role '$EXECUTION_ROLE_NAME' already exists"
else
    # Create trust policy
    cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    aws iam create-role \
        --role-name "$EXECUTION_ROLE_NAME" \
        --assume-role-policy-document file:///tmp/trust-policy.json &> /dev/null
    
    aws iam attach-role-policy \
        --role-name "$EXECUTION_ROLE_NAME" \
        --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" &> /dev/null
    
    # Add Secrets Manager access
    cat > /tmp/secrets-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:${PROJECT_NAME}/*"
    }
  ]
}
EOF

    aws iam put-role-policy \
        --role-name "$EXECUTION_ROLE_NAME" \
        --policy-name "SecretsManagerAccess" \
        --policy-document file:///tmp/secrets-policy.json &> /dev/null
    
    print_success "Task execution role created: $EXECUTION_ROLE_NAME"
fi

# ECS Task Role
TASK_ROLE_NAME="ecsTaskRole-${PROJECT_NAME}"
if aws iam get-role --role-name "$TASK_ROLE_NAME" &> /dev/null; then
    print_info "Task role '$TASK_ROLE_NAME' already exists"
else
    aws iam create-role \
        --role-name "$TASK_ROLE_NAME" \
        --assume-role-policy-document file:///tmp/trust-policy.json &> /dev/null
    
    # Add S3 and other service permissions
    cat > /tmp/task-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::${PROJECT_NAME}-*/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
EOF

    aws iam put-role-policy \
        --role-name "$TASK_ROLE_NAME" \
        --policy-name "ApplicationPermissions" \
        --policy-document file:///tmp/task-policy.json &> /dev/null
    
    print_success "Task role created: $TASK_ROLE_NAME"
fi

# Clean up temp files
rm -f /tmp/trust-policy.json /tmp/secrets-policy.json /tmp/task-policy.json
echo ""

# Step 5: Update Task Definition
echo "📝 Step 5: Updating Task Definition..."
EXECUTION_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${EXECUTION_ROLE_NAME}"
TASK_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${TASK_ROLE_NAME}"

# Update ecs-task-definition.json with actual values
sed -i.bak \
    -e "s|YOUR_ACCOUNT_ID|${AWS_ACCOUNT_ID}|g" \
    -e "s|us-east-1|${AWS_REGION}|g" \
    ecs-task-definition.json

print_success "Task definition updated with account-specific values"
echo ""

# Summary
echo "=============================================="
echo "✅ AWS ECS Setup Complete!"
echo "=============================================="
echo ""
echo "📋 Configuration Summary:"
echo "  - ECR Repository: $ECR_URI"
echo "  - ECS Cluster: $ECS_CLUSTER"
echo "  - Log Group: $LOG_GROUP"
echo "  - Execution Role: $EXECUTION_ROLE_ARN"
echo "  - Task Role: $TASK_ROLE_ARN"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Build and push Docker image:"
echo "   aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI"
echo "   docker build -t $PROJECT_NAME ."
echo "   docker tag $PROJECT_NAME:latest $ECR_URI:latest"
echo "   docker push $ECR_URI:latest"
echo ""
echo "2. Configure Secrets Manager:"
echo "   aws secretsmanager create-secret \\"
echo "     --name ${PROJECT_NAME}/app-secrets \\"
echo "     --secret-string '{\"DATABASE_URL\":\"your-db-url\",\"JWT_SECRET\":\"your-jwt-secret\"}'"
echo ""
echo "3. Create Application Load Balancer and Target Group"
echo ""
echo "4. Register task definition and create ECS service:"
echo "   aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json"
echo "   aws ecs create-service \\"
echo "     --cluster $ECS_CLUSTER \\"
echo "     --service-name $ECS_SERVICE \\"
echo "     --task-definition $ECS_TASK_FAMILY \\"
echo "     --desired-count 2 \\"
echo "     --launch-type FARGATE"
echo ""
echo "5. Set up GitHub Actions secrets:"
echo "   AWS_ACCESS_KEY_ID"
echo "   AWS_SECRET_ACCESS_KEY"
echo ""
echo "📚 Documentation: See README.md 'Deployment with Docker on AWS ECS' section"
echo ""
