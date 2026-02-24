/**
 * Zod Validation Schemas for Train Tracker API
 * 
 * These schemas define the structure and validation rules for all API requests.
 * They can be reused on both client and server for consistent validation.
 */

import { z } from "zod";

/**
 * Authentication Schemas
 */

// Signup schema
export const signupSchema = z.object({
  fullName: z
    .string({ message: "Full name is required" })
    .min(2, { message: "Full name must be at least 2 characters" })
    .max(100, { message: "Full name must not exceed 100 characters" })
    .trim(),
  
  email: z
    .string({ message: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .toLowerCase()
    .trim(),
  
  password: z
    .string({ message: "Password is required" })
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100, { message: "Password must not exceed 100 characters" }),
});

// Login schema
export const loginSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .toLowerCase()
    .trim(),
  
  password: z
    .string({ message: "Password is required" })
    .min(1, { message: "Password is required" }),
});

/**
 * Contact Request Schema
 */

export const contactSchema = z.object({
  category: z
    .string({ message: "Category is required" })
    .min(1, { message: "Category cannot be empty" })
    .trim(),
  
  fullName: z
    .string({ message: "Full name is required" })
    .min(2, { message: "Full name must be at least 2 characters" })
    .max(100, { message: "Full name must not exceed 100 characters" })
    .trim(),
  
  email: z
    .string({ message: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .toLowerCase()
    .trim(),
  
  hasTicket: z
    .boolean({ message: "hasTicket field is required" }),
  
  referenceCode: z
    .string()
    .trim()
    .optional()
    .nullable(),
  
  message: z
    .string({ message: "Message is required" })
    .min(10, { message: "Message must be at least 10 characters" })
    .max(1000, { message: "Message must not exceed 1000 characters" })
    .trim(),
  
  attachmentUrl: z
    .string()
    .url({ message: "Attachment URL must be a valid URL" })
    .optional()
    .nullable(),
}).refine(
  (data) => {
    // If hasTicket is true, referenceCode must be provided
    if (data.hasTicket && (!data.referenceCode || data.referenceCode.trim() === "")) {
      return false;
    }
    return true;
  },
  {
    message: "Reference code is required when hasTicket is true",
    path: ["referenceCode"],
  }
);

/**
 * Upload URL Request Schema
 */

export const uploadUrlRequestSchema = z.object({
  fileName: z
    .string({ message: "File name is required" })
    .min(1, { message: "File name cannot be empty" })
    .max(255, { message: "File name must not exceed 255 characters" })
    .trim(),

  fileType: z
    .string({ message: "File type is required" })
    .min(1, { message: "File type cannot be empty" })
    .trim(),

  fileSize: z
    .number({ message: "File size is required" })
    .int("File size must be an integer")
    .positive("File size must be greater than 0"),

  folder: z
    .string()
    .min(1, { message: "Folder cannot be empty" })
    .max(60, { message: "Folder must not exceed 60 characters" })
    .trim()
    .optional(),

  action: z
    .enum(["upload", "download"])
    .optional()
    .default("upload")
});

/**
 * Train Search Schema
 */

export const trainSearchSchema = z.object({
  query: z
    .string({ message: "Search query is required" })
    .min(2, { message: "Search query must be at least 2 characters" })
    .max(100, { message: "Search query must not exceed 100 characters" })
    .trim(),
  
  page: z
    .number()
    .int("Page must be an integer")
    .positive("Page must be a positive number")
    .optional()
    .default(1),
  
  limit: z
    .number()
    .int("Limit must be an integer")
    .positive("Limit must be a positive number")
    .max(100, "Limit cannot exceed 100")
    .optional()
    .default(10),
});

/**
 * Pagination Schema (for query params)
 */

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(
      z.number().int().positive().min(1, "Page must be at least 1")
    ),
  
  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .pipe(
      z.number().int().positive().min(1).max(100, "Limit cannot exceed 100")
    ),
});

/**
 * Query String Validation Schema
 */

export const queryStringSchema = z.object({
  query: z
    .string({ message: "Query parameter is required" })
    .min(2, { message: "Query must be at least 2 characters" })
    .max(100, { message: "Query must not exceed 100 characters" })
    .trim(),
});

/**
 * TypeScript Types Inferred from Schemas
 * Use these types in your components and API handlers for type safety
 */

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type UploadUrlRequestInput = z.infer<typeof uploadUrlRequestSchema>;
export type TrainSearchInput = z.infer<typeof trainSearchSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type QueryStringInput = z.infer<typeof queryStringSchema>;

/**
 * Schema Validation Examples:
 * 
 * // In API route
 * const result = signupSchema.safeParse(requestBody);
 * if (!result.success) {
 *   // Handle validation errors
 *   return errorResponse(result.error);
 * }
 * const validData = result.data;
 * 
 * // In frontend form
 * try {
 *   signupSchema.parse(formData);
 *   // Submit to API
 * } catch (error) {
 *   // Show validation errors
 * }
 */
