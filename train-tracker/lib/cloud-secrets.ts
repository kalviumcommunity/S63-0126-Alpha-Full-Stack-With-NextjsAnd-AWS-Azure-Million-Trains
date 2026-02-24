import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

type SecretProvider = "aws" | "azure" | "none";

interface LoadSecretsOptions {
  applyToEnv?: boolean;
  cacheSeconds?: number;
}

let cachedSecrets: Record<string, string> | null = null;
let cacheExpiresAt = 0;

function resolveProvider(): SecretProvider {
  const provider = (process.env.SECRET_PROVIDER || "none").toLowerCase();
  if (provider === "aws" || provider === "azure") {
    return provider;
  }
  return "none";
}

function applySecrets(secrets: Record<string, string>): void {
  Object.entries(secrets).forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

function parseKeyList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function loadAwsSecrets(): Promise<Record<string, string>> {
  const secretId = process.env.AWS_SECRET_ARN || process.env.SECRET_ARN;
  if (!secretId) {
    throw new Error("AWS secret ARN is not configured");
  }

  const region = process.env.AWS_SECRET_REGION || process.env.AWS_REGION || "us-east-1";
  const client = new SecretsManagerClient({ region });

  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretId })
  );

  if (!response.SecretString) {
    throw new Error("AWS Secrets Manager returned an empty secret string");
  }

  try {
    return JSON.parse(response.SecretString) as Record<string, string>;
  } catch (error) {
    throw new Error("AWS secret value must be valid JSON");
  }
}

async function loadAzureSecrets(): Promise<Record<string, string>> {
  const vaultName = process.env.AZURE_KEY_VAULT_NAME || process.env.KEY_VAULT_NAME;
  if (!vaultName) {
    throw new Error("Azure Key Vault name is not configured");
  }

  const vaultUrl =
    process.env.AZURE_KEY_VAULT_URL || `https://${vaultName}.vault.azure.net`;

  const secretKeys = parseKeyList(process.env.CLOUD_SECRET_KEYS);
  if (secretKeys.length === 0) {
    throw new Error("CLOUD_SECRET_KEYS must list the secrets to fetch from Key Vault");
  }

  const credential = new DefaultAzureCredential();
  const client = new SecretClient(vaultUrl, credential);
  const secrets: Record<string, string> = {};

  for (const key of secretKeys) {
    const secret = await client.getSecret(key);
    if (!secret.value) {
      throw new Error(`Azure secret '${key}' has no value`);
    }
    secrets[key] = secret.value;
  }

  return secrets;
}

export async function loadCloudSecrets(
  options: LoadSecretsOptions = {}
): Promise<Record<string, string>> {
  const { applyToEnv = false, cacheSeconds = 60 } = options;
  const provider = resolveProvider();

  if (provider === "none") {
    return {};
  }

  const now = Date.now();
  if (cachedSecrets && cacheExpiresAt > now) {
    if (applyToEnv) {
      applySecrets(cachedSecrets);
    }
    return { ...cachedSecrets };
  }

  const secrets = provider === "aws" ? await loadAwsSecrets() : await loadAzureSecrets();

  cachedSecrets = secrets;
  cacheExpiresAt = now + cacheSeconds * 1000;

  if (applyToEnv) {
    applySecrets(secrets);
  }

  return { ...secrets };
}
