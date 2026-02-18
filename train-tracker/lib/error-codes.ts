/**
 * Global Error Codes for API Responses
 * Used for consistent error identification and monitoring
 */

export const ERROR_CODES = {
  // Validation Errors (4xx)
  VALIDATION_ERROR: "E001",
  MISSING_FIELD: "E002",
  INVALID_FORMAT: "E003",
  INVALID_EMAIL: "E004",
  WEAK_PASSWORD: "E005",
  
  // Authentication & Authorization (4xx)
  UNAUTHORIZED: "E401",
  FORBIDDEN: "E403",
  INVALID_CREDENTIALS: "E011",
  SESSION_EXPIRED: "E012",
  
  // Resource Errors (4xx)
  NOT_FOUND: "E404",
  RESOURCE_EXISTS: "E409",
  CONFLICT: "E010",
  
  // Server Errors (5xx)
  INTERNAL_ERROR: "E500",
  DATABASE_ERROR: "E501",
  EXTERNAL_API_ERROR: "E502",
  SERVICE_UNAVAILABLE: "E503",
  
  // Domain-Specific Errors
  USER_CREATE_FAILED: "E201",
  USER_NOT_FOUND: "E202",
  LOGIN_FAILED: "E203",
  SIGNUP_FAILED: "E204",
  
  TRAIN_SEARCH_FAILED: "E301",
  NO_TRAINS_FOUND: "E302",
  
  CONTACT_SUBMIT_FAILED: "E401",
  CONTACT_VALIDATION_FAILED: "E402",
} as const;

/**
 * Get human-readable message for error code
 */
export const getErrorCodeMessage = (code: keyof typeof ERROR_CODES | (string & {})): string => {
  const messages: Record<string, string> = {
    [ERROR_CODES.VALIDATION_ERROR]: "Invalid input provided",
    [ERROR_CODES.MISSING_FIELD]: "Required field is missing",
    [ERROR_CODES.INVALID_FORMAT]: "Invalid format provided",
    [ERROR_CODES.INVALID_EMAIL]: "Email format is invalid",
    [ERROR_CODES.WEAK_PASSWORD]: "Password does not meet requirements",
    
    [ERROR_CODES.UNAUTHORIZED]: "Authentication required",
    [ERROR_CODES.FORBIDDEN]: "Access denied",
    [ERROR_CODES.INVALID_CREDENTIALS]: "Invalid email or password",
    [ERROR_CODES.SESSION_EXPIRED]: "Session has expired",
    
    [ERROR_CODES.NOT_FOUND]: "Resource not found",
    [ERROR_CODES.RESOURCE_EXISTS]: "Resource already exists",
    [ERROR_CODES.CONFLICT]: "Operation conflicts with existing data",
    
    [ERROR_CODES.INTERNAL_ERROR]: "Internal server error",
    [ERROR_CODES.DATABASE_ERROR]: "Database operation failed",
    [ERROR_CODES.EXTERNAL_API_ERROR]: "External API error",
    [ERROR_CODES.SERVICE_UNAVAILABLE]: "Service temporarily unavailable",
    
    [ERROR_CODES.USER_CREATE_FAILED]: "Failed to create user account",
    [ERROR_CODES.USER_NOT_FOUND]: "User not found",
    [ERROR_CODES.LOGIN_FAILED]: "Login failed",
    [ERROR_CODES.SIGNUP_FAILED]: "Signup failed",
    
    [ERROR_CODES.TRAIN_SEARCH_FAILED]: "Failed to search trains",
    [ERROR_CODES.NO_TRAINS_FOUND]: "No trains found for your search",
    
    [ERROR_CODES.CONTACT_SUBMIT_FAILED]: "Failed to submit contact request",
    [ERROR_CODES.CONTACT_VALIDATION_FAILED]: "Contact request validation failed",
  };
  
  return messages[code] || "An error occurred";
};
