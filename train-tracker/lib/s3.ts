import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * AWS S3 Client Configuration
 * 
 * Required environment variables:
 * - AWS_ACCESS_KEY_ID: AWS access key
 * - AWS_SECRET_ACCESS_KEY: AWS secret key
 * - AWS_REGION: AWS region (e.g., us-east-1, ap-south-1)
 * - AWS_BUCKET_NAME: S3 bucket name for uploads
 */

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const bucketName =
  process.env.AWS_S3_BUCKET ||
  process.env.AWS_BUCKET_NAME ||
  "";

/**
 * File upload utilities for AWS S3
 */
export const s3Utils = {
  /**
   * Generate a pre-signed URL for uploading a file
   * 
   * @param fileName - Name of the file to upload (becomes the S3 key)
   * @param contentType - MIME type of the file
   * @param expiresIn - URL expiry time in seconds (default: 60)
   * @returns Pre-signed URL for uploading
   * 
   * @example
   * const url = await s3Utils.getUploadUrl("profile-pic.jpg", "image/jpeg", 60);
   * // Client can now PUT file directly to this URL
   */
  async getUploadUrl(
    fileName: string,
    contentType: string,
    expiresIn: number = 60
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        ContentType: contentType,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error("[S3] Error generating upload URL:", error);
      throw new Error("Failed to generate pre-signed upload URL");
    }
  },

  /**
   * Generate a pre-signed URL for downloading/viewing a file
   * 
   * @param fileName - Name of the file in S3
   * @param expiresIn - URL expiry time in seconds (default: 3600 = 1 hour)
   * @returns Pre-signed URL for downloading
   */
  async getDownloadUrl(
    fileName: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error("[S3] Error generating download URL:", error);
      throw new Error("Failed to generate pre-signed download URL");
    }
  },

  /**
   * Delete a file from S3
   * 
   * @param fileName - Name of the file to delete
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      });

      await s3Client.send(command);
      console.log(`[S3] File deleted: ${fileName}`);
    } catch (error) {
      console.error("[S3] Error deleting file:", error);
      throw new Error("Failed to delete file from S3");
    }
  },

  /**
   * Construct a public S3 URL (if bucket allows public access)
   * 
   * @param fileName - Name of the file
   * @returns Public S3 URL (assumes bucket is publicly readable)
   */
  getPublicUrl(fileName: string): string {
    return `https://${bucketName}.s3.${
      process.env.AWS_REGION || "us-east-1"
    }.amazonaws.com/${fileName}`;
  },

  /**
   * Generate a unique file name with timestamp to avoid collisions
   * 
   * @param originalFileName - Original name of the file
   * @returns Unique file name with timestamp
   * 
   * @example
   * s3Utils.generateUniqueFileName("photo.jpg")
   * // Returns: "photo-1707987654321.jpg"
   */
  generateUniqueFileName(originalFileName: string): string {
    const timestamp = Date.now();
    const [name, ext] = originalFileName.split(".");
    return `${name}-${timestamp}.${ext}`;
  },

  /**
   * Generate a unique file path with user/folder organization
   * 
   * @param userId - User ID (for organizing uploads by user)
   * @param fileName - Original file name
   * @param folderType - Optional folder type (e.g., "avatars", "documents")
   * @returns Organized file path
   * 
   * @example
   * s3Utils.generateFilePath("user-123", "avatar.jpg", "avatars")
   * // Returns: "avatars/user-123/avatar-1707987654321.jpg"
   */
  generateFilePath(
    userId: string,
    fileName: string,
    folderType: string = "uploads"
  ): string {
    const uniqueFileName = this.generateUniqueFileName(fileName);
    return `${folderType}/${userId}/${uniqueFileName}`;
  },
};

/**
 * AWS S3 Configuration Constants
 */
export const S3_CONFIG = {
  // File upload expiry (pre-signed URLs valid for 60 seconds)
  UPLOAD_URL_EXPIRY: 60,

  // File download expiry (pre-signed URLs valid for 1 hour)
  DOWNLOAD_URL_EXPIRY: 3600,

  // Maximum file size allowed (100 MB)
  MAX_FILE_SIZE: 100 * 1024 * 1024,

  // Allowed MIME types
  ALLOWED_MIME_TYPES: [
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",

    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    // Text
    "text/plain",
    "text/csv",
    "application/json",

    // Videos
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
  ],

  // Allowed file extensions
  ALLOWED_EXTENSIONS: [
    // Images
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "svg",

    // Documents
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",

    // Text
    "txt",
    "csv",
    "json",

    // Videos
    "mp4",
    "mpeg",
    "mov",
  ],
};

export default s3Client;
