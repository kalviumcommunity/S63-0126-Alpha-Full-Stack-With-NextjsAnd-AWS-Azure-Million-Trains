import type { UseFormRegister, FieldError } from "react-hook-form";

interface FormTextareaProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  className?: string;
}

/**
 * Reusable textarea component for forms
 * 
 * Features:
 * - Works with React Hook Form
 * - Displays validation errors
 * - Accessible with proper labels
 * - Customizable rows and styling
 * 
 * @example
 * ```tsx
 * <FormTextarea
 *   label="Message"
 *   name="message"
 *   register={register}
 *   error={errors.message}
 *   rows={5}
 * />
 * ```
 */
export default function FormTextarea({
  label,
  name,
  register,
  error,
  placeholder,
  required = false,
  disabled = false,
  rows = 4,
  className = "",
}: FormTextareaProps) {
  const hasError = !!error;

  return (
    <div className="mb-4">
      <label 
        htmlFor={name} 
        className="block mb-2 font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <textarea
        id={name}
        {...register(name)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${name}-error` : undefined}
        className={`
          w-full px-3 py-2 border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          resize-vertical
          ${hasError ? "border-red-500 focus:ring-red-500" : "border-gray-300"}
          ${className}
        `}
      />
      
      {hasError && (
        <p 
          id={`${name}-error`}
          className="text-red-500 text-sm mt-1 flex items-center"
          role="alert"
        >
          <span className="mr-1">⚠️</span>
          {error.message}
        </p>
      )}
    </div>
  );
}
