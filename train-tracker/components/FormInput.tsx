import type { UseFormRegister, FieldError } from "react-hook-form";

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Reusable form input component with built-in error handling
 * 
 * Features:
 * - Works with React Hook Form
 * - Displays validation errors
 * - Accessible with proper labels
 * - Customizable styling
 * - Supports all input types
 * 
 * @example
 * ```tsx
 * <FormInput
 *   label="Email"
 *   name="email"
 *   type="email"
 *   register={register}
 *   error={errors.email}
 * />
 * ```
 */
export default function FormInput({
  label,
  name,
  type = "text",
  register,
  error,
  placeholder,
  required = false,
  disabled = false,
  className = "",
}: FormInputProps) {
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
      
      <input
        id={name}
        type={type}
        {...register(name)}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${name}-error` : undefined}
        className={`
          w-full px-3 py-2 border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
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
