import type { UseFormRegister, FieldError } from "react-hook-form";

interface FormSelectProps {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Reusable select dropdown component for forms
 * 
 * Features:
 * - Works with React Hook Form
 * - Displays validation errors
 * - Accessible with proper labels
 * - Customizable options
 * 
 * @example
 * ```tsx
 * <FormSelect
 *   label="Category"
 *   name="category"
 *   options={[
 *     { value: "bug", label: "Bug Report" },
 *     { value: "feature", label: "Feature Request" }
 *   ]}
 *   register={register}
 *   error={errors.category}
 * />
 * ```
 */
export default function FormSelect({
  label,
  name,
  options,
  register,
  error,
  required = false,
  disabled = false,
  className = "",
}: FormSelectProps) {
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
      
      <select
        id={name}
        {...register(name)}
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
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
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
