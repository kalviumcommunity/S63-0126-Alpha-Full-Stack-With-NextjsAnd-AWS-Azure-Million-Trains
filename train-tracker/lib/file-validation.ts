import { S3_CONFIG } from "./s3";

/**
 * File validation utilities for secure uploads
 */

export interface FileValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FileValidationError[];
}

/**
 * Validate file type by MIME type
 * 
 * @param mimeType - MIME type of the file
 * @returns true if MIME type is allowed
 */
export function isValidMimeType(mimeType: string): boolean {
  return S3_CONFIG.ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Validate file extension
 * 
 * @param fileName - Name of the file
 * @returns true if extension is allowed
 */
export function isValidExtension(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return S3_CONFIG.ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Validate file size
 * 
 * @param fileSize - Size in bytes
 * @returns true if file size is within limits
 */
export function isValidFileSize(fileSize: number): boolean {
  return fileSize > 0 && fileSize <= S3_CONFIG.MAX_FILE_SIZE;
}

/**
 * Extract file extension from file name
 * 
 * @param fileName - Name of the file
 * @returns File extension
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

/**
 * Extract file name without extension
 * 
 * @param fileName - Name of the file
 * @returns File name without extension
 */
export function getFileNameWithoutExt(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot === -1 ? fileName : fileName.substring(0, lastDot);
}

/**
 * Sanitize file name to prevent directory traversal and invalid characters
 * 
 * @param fileName - Original file name
 * @returns Sanitized file name
 */
export function sanitizeFileName(fileName: string): string {
  // Remove directory traversal attempts
  let sanitized = fileName.replace(/\.\./g, "").replace(/[/\\]/g, "");

  // Remove special characters except dots and hyphens
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "-");

  // Remove multiple consecutive hyphens
  sanitized = sanitized.replace(/-+/g, "-");

  // Trim hyphens from start and end
  sanitized = sanitized.trim().replace(/^-+|-+$/g, "");

  return sanitized;
}

/**
 * Format file size for display
 * 
 * @param bytes - File size in bytes
 * @returns Human-readable file size
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Validate complete file upload request
 * 
 * @param fileName - Name of the file
 * @param fileSize - Size in bytes
 * @param mimeType - MIME type of the file
 * @returns Validation result with errors
 */
export function validateFileUpload(
  fileName: string,
  fileSize: number,
  mimeType: string
): ValidationResult {
  const errors: FileValidationError[] = [];

  // Validate file name
  if (!fileName || fileName.trim().length === 0) {
    errors.push({
      field: "fileName",
      message: "File name is required",
    });
  }

  // Validate file extension
  if (!isValidExtension(fileName)) {
    errors.push({
      field: "fileName",
      message: `File extension not allowed. Allowed: ${S3_CONFIG.ALLOWED_EXTENSIONS.join(
        ", "
      )}`,
    });
  }

  // Validate file size
  if (!isValidFileSize(fileSize)) {
    if (fileSize === 0) {
      errors.push({
        field: "fileSize",
        message: "File size must be greater than 0 bytes",
      });
    } else {
      errors.push({
        field: "fileSize",
        message: `File size must not exceed ${formatFileSize(
          S3_CONFIG.MAX_FILE_SIZE
        )}`,
      });
    }
  }

  // Validate MIME type
  if (!isValidMimeType(mimeType)) {
    errors.push({
      field: "mimeType",
      message: `File type not allowed. Allowed types: ${S3_CONFIG.ALLOWED_MIME_TYPES.join(
        ", "
      )}`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get human-readable error messages
 * 
 * @param errors - Array of validation errors
 * @returns Array of error messages
 */
export function getErrorMessages(errors: FileValidationError[]): string[] {
  return errors.map((error) => error.message);
}

/**
 * Check if file is an image
 * 
 * @param mimeType - MIME type
 * @returns true if file is an image
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Check if file is a document
 * 
 * @param mimeType - MIME type
 * @returns true if file is a document
 */
export function isDocument(mimeType: string): boolean {
  const documentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
  ];
  return documentTypes.includes(mimeType);
}

/**
 * Check if file is a video
 * 
 * @param mimeType - MIME type
 * @returns true if file is a video
 */
export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}
