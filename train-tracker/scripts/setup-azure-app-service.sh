#!/bin/bash
# =============================================================================
# Azure App Service Deployment Setup Script
# =============================================================================
# This script helps configure Azure resources for Train Tracker deployment
# Prerequisites: Azure CLI installed and logged in (az login)
# =============================================================================

set -e  # Exit on error

echo "🚀 Azure App Service Deployment Setup for Train Tracker"
echo "========================================================"
echo ""

# Configuration variables
PROJECT_NAME="train-tracker"
RESOURCE_GROUP="${PROJECT_NAME}-rg"
LOCATION="${AZURE_LOCATION:-eastus}"
ACR_NAME="${PROJECT_NAME//-/}"  # Remove hyphens for ACR (max 50 alphanumeric chars)
APP_SERVICE_PLAN="${PROJECT_NAME}-asp"
WEB_APP_NAME="${PROJECT_NAME}-app"
KEY_VAULT_NAME="${PROJECT_NAME}-kv"
STORAGE_ACCOUNT="${PROJECT_NAME//-/}storage"

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

# Check Azure CLI
if ! command -v az &> /dev/null; then
    print_error "Azure CLI not found. Please install it first."
    exit 1
fi

# Check login status
if ! az account show &> /dev/null; then
    print_error "Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Get subscription details
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
print_success "Subscription: $SUBSCRIPTION_NAME ($SUBSCRIPTION_ID)"
print_success "Location: $LOCATION"
echo ""

# Step 1: Create Resource Group
echo "📦 Step 1: Creating Resource Group..."
if az group exists --name "$RESOURCE_GROUP" | grep -q "true"; then
    print_info "Resource group '$RESOURCE_GROUP' already exists"
else
    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --output none
    print_success "Resource group created: $RESOURCE_GROUP"
fi
echo ""

# Step 2: Create Azure Container Registry
echo "🐳 Step 2: Creating Azure Container Registry..."
if az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    print_info "Container registry '$ACR_NAME' already exists"
else
    az acr create \
        --name "$ACR_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku Basic \
        --admin-enabled true \
        --output none
    print_success "Container registry created: $ACR_NAME"
fi

ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"
ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query passwords[0].value -o tsv)
echo ""

# Step 3: Create Key Vault
echo "🔐 Step 3: Creating Key Vault..."
if az keyvault show --name "$KEY_VAULT_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    print_info "Key Vault '$KEY_VAULT_NAME' already exists"
else
    az keyvault create \
        --name "$KEY_VAULT_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --enable-rbac-authorization false \
        --output none
    print_success "Key Vault created: $KEY_VAULT_NAME"
fi
echo ""

# Step 4: Create Storage Account
echo "💾 Step 4: Creating Storage Account..."
if az storage account show --name "$STORAGE_ACCOUNT" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    print_info "Storage account '$STORAGE_ACCOUNT' already exists"
else
    az storage account create \
        --name "$STORAGE_ACCOUNT" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku Standard_LRS \
        --kind StorageV2 \
        --https-only true \
        --min-tls-version TLS1_2 \
        --output none
    print_success "Storage account created: $STORAGE_ACCOUNT"
fi

# Create blob container
STORAGE_KEY=$(az storage account keys list --account-name "$STORAGE_ACCOUNT" --resource-group "$RESOURCE_GROUP" --query [0].value -o tsv)
if az storage container exists --name uploads --account-name "$STORAGE_ACCOUNT" --account-key "$STORAGE_KEY" --query exists -o tsv | grep -q "true"; then
    print_info "Blob container 'uploads' already exists"
else
    az storage container create \
        --name uploads \
        --account-name "$STORAGE_ACCOUNT" \
        --account-key "$STORAGE_KEY" \
        --public-access off \
        --output none
    print_success "Blob container created: uploads"
fi
echo ""

# Step 5: Create App Service Plan
echo "🌐 Step 5: Creating App Service Plan..."
if az appservice plan show --name "$APP_SERVICE_PLAN" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    print_info "App Service Plan '$APP_SERVICE_PLAN' already exists"
else
    az appservice plan create \
        --name "$APP_SERVICE_PLAN" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --is-linux \
        --sku B1 \
        --output none
    print_success "App Service Plan created: $APP_SERVICE_PLAN"
fi
echo ""

# Step 6: Create Web App
echo "🚀 Step 6: Creating Web App..."
if az webapp show --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    print_info "Web App '$WEB_APP_NAME' already exists"
else
    az webapp create \
        --name "$WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --plan "$APP_SERVICE_PLAN" \
        --deployment-container-image-name "nginx:latest" \
        --output none
    print_success "Web App created: $WEB_APP_NAME"
fi

# Get Web App principal ID for Key Vault access
PRINCIPAL_ID=$(az webapp identity assign \
    --name "$WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query principalId -o tsv)
print_success "Managed identity enabled: $PRINCIPAL_ID"
echo ""

# Step 7: Grant Key Vault Access
echo "🔑 Step 7: Granting Key Vault Access..."
az keyvault set-policy \
    --name "$KEY_VAULT_NAME" \
    --object-id "$PRINCIPAL_ID" \
    --secret-permissions get list \
    --output none
print_success "Key Vault access granted to Web App"
echo ""

# Step 8: Configure Container Registry
echo "⚙️  Step 8: Configuring Container Registry..."
az webapp config container set \
    --name "$WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --docker-custom-image-name "${ACR_LOGIN_SERVER}/${PROJECT_NAME}:latest" \
    --docker-registry-server-url "https://${ACR_LOGIN_SERVER}" \
    --docker-registry-server-user "$ACR_USERNAME" \
    --docker-registry-server-password "$ACR_PASSWORD" \
    --output none
print_success "Container registry configured"
echo ""

# Step 9: Configure App Settings
echo "🔧 Step 9: Configuring App Settings..."
az webapp config appsettings set \
    --name "$WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --settings \
        WEBSITES_PORT=3000 \
        PORT=3000 \
        NODE_ENV=production \
        NEXT_TELEMETRY_DISABLED=1 \
        SECRET_PROVIDER=azure \
        AZURE_KEY_VAULT_NAME="$KEY_VAULT_NAME" \
        STORAGE_PROVIDER=azure \
        AZURE_STORAGE_ACCOUNT_NAME="$STORAGE_ACCOUNT" \
        AZURE_STORAGE_CONTAINER_NAME=uploads \
    --output none
print_success "App settings configured"

# Configure health check
az webapp config set \
    --name "$WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --health-check-path "/api/health" \
    --always-on true \
    --http20-enabled true \
    --min-tls-version 1.2 \
    --ftps-state Disabled \
    --output none
print_success "Health check and security settings configured"
echo ""

# Step 10: Create Service Principal for GitHub Actions
echo "👤 Step 10: Creating Service Principal for CI/CD..."
SP_NAME="${PROJECT_NAME}-github-actions"
SCOPE="/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}"

if az ad sp list --display-name "$SP_NAME" --query [0].appId -o tsv | grep -q "."; then
    print_info "Service Principal '$SP_NAME' already exists"
    SP_APP_ID=$(az ad sp list --display-name "$SP_NAME" --query [0].appId -o tsv)
else
    SP_CREDENTIALS=$(az ad sp create-for-rbac \
        --name "$SP_NAME" \
        --role Contributor \
        --scopes "$SCOPE" \
        --sdk-auth)
    SP_APP_ID=$(echo "$SP_CREDENTIALS" | jq -r '.clientId')
    print_success "Service Principal created: $SP_NAME"
    echo ""
    print_info "GitHub Secret AZURE_CREDENTIALS (copy this):"
    echo "$SP_CREDENTIALS"
    echo ""
fi

# Grant ACR push permission
az role assignment create \
    --assignee "$SP_APP_ID" \
    --role AcrPush \
    --scope "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.ContainerRegistry/registries/${ACR_NAME}" \
    --output none 2>/dev/null || print_info "ACR push role already assigned"
print_success "ACR push permission granted"
echo ""

# Summary
echo "========================================================"
echo "✅ Azure App Service Setup Complete!"
echo "========================================================"
echo ""
echo "📋 Configuration Summary:"
echo "  - Resource Group: $RESOURCE_GROUP"
echo "  - Container Registry: $ACR_LOGIN_SERVER"
echo "  - Web App: https://${WEB_APP_NAME}.azurewebsites.net"
echo "  - Key Vault: https://${KEY_VAULT_NAME}.vault.azure.net"
echo "  - Storage Account: $STORAGE_ACCOUNT"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Build and push Docker image:"
echo "   az acr login --name $ACR_NAME"
echo "   docker build -t $PROJECT_NAME ."
echo "   docker tag $PROJECT_NAME:latest ${ACR_LOGIN_SERVER}/${PROJECT_NAME}:latest"
echo "   docker push ${ACR_LOGIN_SERVER}/${PROJECT_NAME}:latest"
echo ""
echo "2. Add secrets to Key Vault:"
echo "   az keyvault secret set --vault-name $KEY_VAULT_NAME --name DATABASE-URL --value 'your-database-url'"
echo "   az keyvault secret set --vault-name $KEY_VAULT_NAME --name JWT-SECRET --value 'your-jwt-secret'"
echo ""
echo "3. Configure environment in App Service:"
echo "   az webapp config appsettings set \\"
echo "     --name $WEB_APP_NAME \\"
echo "     --resource-group $RESOURCE_GROUP \\"
echo "     --settings CLOUD_SECRET_KEYS='DATABASE-URL,JWT-SECRET,JWT-REFRESH-SECRET'"
echo ""
echo "4. Set up GitHub Actions secrets:"
echo "   AZURE_CREDENTIALS (see output above)"
echo "   AZURE_ACR_USERNAME=$ACR_USERNAME"
echo "   AZURE_ACR_PASSWORD=$ACR_PASSWORD"
echo ""
echo "5. Update GitHub workflow variables:"
echo "   AZURE_WEBAPP_NAME=$WEB_APP_NAME"
echo "   ACR_LOGIN_SERVER=$ACR_LOGIN_SERVER"
echo "   RESOURCE_GROUP=$RESOURCE_GROUP"
echo ""
echo "📚 Documentation: See README.md 'Deployment with Docker on Azure App Service' section"
echo ""
