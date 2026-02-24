import { NextResponse } from "next/server";
import { successResponse, validationErrorResponse, forbiddenResponse, errorResponse } from "../../../../lib/api-response";
import { parseAndValidateBody } from "../../../../lib/validation-helpers";
import { uploadUrlRequestSchema } from "../../../../lib/validation-schemas";
import { sanitizeFileName, validateFileUpload } from "../../../../lib/file-validation";
import { s3Utils, S3_CONFIG } from "../../../../lib/s3";
import { azureBlobUtils, AZURE_BLOB_CONFIG } from "../../../../lib/azure-blob";

function buildObjectKey(fileName: string, folder?: string): string {
  const safeFileName = sanitizeFileName(fileName);
  const uniqueFileName = s3Utils.generateUniqueFileName(safeFileName);

  const cleanedFolder = (folder || "uploads")
    .replace(/\.+/g, "")
    .replace(/[^a-zA-Z0-9/_-]/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .trim();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${cleanedFolder}/${year}/${month}/${uniqueFileName}`;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const uploadsEnabled = (process.env.FEATURE_FILE_UPLOADS || "false").toLowerCase() === "true";
    if (!uploadsEnabled) {
      return forbiddenResponse("File uploads are disabled in this environment");
    }

    const body = await parseAndValidateBody(request, uploadUrlRequestSchema);
    const { fileName, fileType, fileSize, folder, action } = body;

    const validation = validateFileUpload(fileName, fileSize, fileType);
    if (!validation.isValid) {
      const errors: Record<string, string> = {};
      validation.errors.forEach((error) => {
        errors[error.field] = error.message;
      });
      return validationErrorResponse(errors);
    }

    const provider = (process.env.STORAGE_PROVIDER || "aws").toLowerCase();
    const objectKey = buildObjectKey(fileName, folder);

    if (provider === "azure") {
      if (!process.env.AZURE_STORAGE_ACCOUNT_NAME || !process.env.AZURE_STORAGE_ACCOUNT_KEY) {
        return errorResponse("Azure storage credentials are not configured", 500);
      }

      if (action === "download") {
        const downloadUrl = await azureBlobUtils.getDownloadUrl(
          objectKey,
          AZURE_BLOB_CONFIG.DOWNLOAD_URL_EXPIRY
        );

        return successResponse({
          provider,
          action: "download",
          fileKey: objectKey,
          downloadUrl,
          expiresIn: AZURE_BLOB_CONFIG.DOWNLOAD_URL_EXPIRY
        });
      }

      const uploadUrl = await azureBlobUtils.getUploadUrl(
        objectKey,
        AZURE_BLOB_CONFIG.UPLOAD_URL_EXPIRY
      );

      return successResponse({
        provider,
        action: "upload",
        fileKey: objectKey,
        uploadUrl,
        expiresIn: AZURE_BLOB_CONFIG.UPLOAD_URL_EXPIRY,
        method: "PUT",
        headers: {
          "Content-Type": fileType
        }
      }, "Upload URL generated successfully");
    }

    if (provider !== "aws") {
      return errorResponse("Unsupported storage provider", 400);
    }

    if (!process.env.AWS_S3_BUCKET && !process.env.AWS_BUCKET_NAME) {
      return errorResponse("AWS S3 bucket name is not configured", 500);
    }

    if (action === "download") {
      const downloadUrl = await s3Utils.getDownloadUrl(
        objectKey,
        S3_CONFIG.DOWNLOAD_URL_EXPIRY
      );

      return successResponse({
        provider,
        action: "download",
        fileKey: objectKey,
        downloadUrl,
        expiresIn: S3_CONFIG.DOWNLOAD_URL_EXPIRY
      });
    }

    const uploadUrl = await s3Utils.getUploadUrl(
      objectKey,
      fileType,
      S3_CONFIG.UPLOAD_URL_EXPIRY
    );

    return successResponse({
      provider,
      action: "upload",
      fileKey: objectKey,
      uploadUrl,
      expiresIn: S3_CONFIG.UPLOAD_URL_EXPIRY,
      method: "PUT",
      headers: {
        "Content-Type": fileType
      }
    }, "Upload URL generated successfully");
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("Upload URL error:", error);
    return errorResponse("Failed to generate upload URL", 500);
  }
}
