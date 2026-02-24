import {
  BlobSASPermissions,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters
} from "@azure/storage-blob";

/**
 * Azure Blob Storage utilities
 *
 * Required environment variables:
 * - AZURE_STORAGE_ACCOUNT_NAME
 * - AZURE_STORAGE_ACCOUNT_KEY
 * - AZURE_STORAGE_CONTAINER
 */

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "";
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || "";
const containerName = process.env.AZURE_STORAGE_CONTAINER || "uploads";

function getSharedKeyCredential(): StorageSharedKeyCredential {
  if (!accountName || !accountKey) {
    throw new Error("Azure storage account credentials are missing");
  }

  return new StorageSharedKeyCredential(accountName, accountKey);
}

function getBlobUrl(blobName: string): string {
  return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;
}

export const azureBlobUtils = {
  async getUploadUrl(
    blobName: string,
    expiresInSeconds: number = 60
  ): Promise<string> {
    const sharedKeyCredential = getSharedKeyCredential();

    const expiresOn = new Date(Date.now() + expiresInSeconds * 1000);
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse("cw"),
        expiresOn,
        protocol: SASProtocol.Https
      },
      sharedKeyCredential
    ).toString();

    return `${getBlobUrl(blobName)}?${sasToken}`;
  },

  async getDownloadUrl(
    blobName: string,
    expiresInSeconds: number = 3600
  ): Promise<string> {
    const sharedKeyCredential = getSharedKeyCredential();

    const expiresOn = new Date(Date.now() + expiresInSeconds * 1000);
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse("r"),
        expiresOn,
        protocol: SASProtocol.Https
      },
      sharedKeyCredential
    ).toString();

    return `${getBlobUrl(blobName)}?${sasToken}`;
  },

  getPublicUrl(blobName: string): string {
    return getBlobUrl(blobName);
  },

  generateUniqueFileName(originalFileName: string): string {
    const timestamp = Date.now();
    const [name, ext] = originalFileName.split(".");
    return `${name}-${timestamp}.${ext}`;
  }
};

export const AZURE_BLOB_CONFIG = {
  UPLOAD_URL_EXPIRY: 60,
  DOWNLOAD_URL_EXPIRY: 3600
};
