# React Hook Form + Zod Quick Reference

## 📦 Installation

```bash
npm install react-hook-form zod @hookform/resolvers
```

---

## 🚀 Basic Setup

### 1. Define Schema

```typescript
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
});

type FormData = z.infer<typeof schema>;
```

### 2. Setup Form

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
  reset,
  watch,
} = useForm<FormData>({
  resolver: zodResolver(schema),
  mode: "onBlur",
});
```

### 3. Handle Submit

```typescript
const onSubmit = async (data: FormData) => {
  console.log("Valid data:", data);
  // API call here
  reset(); // Clear form
};
```

### 4. Render Form

```typescript
<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register("email")} />
  {errors.email && <p>{errors.email.message}</p>}
  
  <button type="submit" disabled={isSubmitting}>
    Submit
  </button>
</form>
```

---

## 📋 Common Zod Patterns

### String Validation

```typescript
z.string()
  .min(3, "Min 3 characters")
  .max(50, "Max 50 characters")
  .email("Invalid email")
  .url("Invalid URL")
  .regex(/^[A-Z0-9]+$/i, "Alphanumeric only")
  .trim()
  .toLowerCase()
  .optional()
  .nullable()
  .default("default value")
```

### Number Validation

```typescript
z.number()
  .min(0, "Must be positive")
  .max(100, "Max 100")
  .int("Must be integer")
  .positive()
  .multipleOf(5)
```

### Boolean & Enum

```typescript
z.boolean()
z.enum(["option1", "option2"])
z.nativeEnum(MyEnum)
```

### Arrays & Objects

```typescript
z.array(z.string()).min(1).max(10)
z.object({
  nested: z.object({ value: z.string() })
})
```

### Optional & Nullable

```typescript
z.string().optional()           // string | undefined
z.string().nullable()           // string | null
z.string().nullish()            // string | null | undefined
z.string().or(z.literal(""))    // string (allows empty)
```

### Custom Validation

```typescript
z.string().refine(
  (val) => val !== "admin",
  { message: "Username 'admin' not allowed" }
)

// Async validation
z.string().refine(
  async (val) => {
    const res = await checkUsername(val);
    return res.available;
  },
  { message: "Username taken" }
)
```

### Dependent Fields

```typescript
z.object({
  password: z.string().min(6),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
)
```

### Conditional Validation

```typescript
z.object({
  hasAccount: z.boolean(),
  accountId: z.string().optional(),
}).refine(
  (data) => !data.hasAccount || data.accountId,
  {
    message: "Account ID required",
    path: ["accountId"],
  }
)
```

### Transform & Preprocess

```typescript
z.string().transform((val) => val.toLowerCase())
z.preprocess((val) => String(val), z.string())
```

---

## 🎯 useForm Options

```typescript
useForm<FormData>({
  resolver: zodResolver(schema),
  mode: "onBlur",              // onBlur | onChange | onSubmit | all
  reValidateMode: "onChange",   // onChange | onBlur | onSubmit
  defaultValues: {
    email: "",
    password: "",
  },
  shouldFocusError: true,       // Focus first error on submit
  shouldUnregister: false,      // Keep values on unmount
  criteriaMode: "firstError",   // firstError | all
})
```

---

## 📝 Form Methods

### register

```typescript
<input {...register("fieldName")} />
<input {...register("fieldName", { valueAsNumber: true })} />
```

### handleSubmit

```typescript
<form onSubmit={handleSubmit(onSubmit, onError)}>
```

### reset

```typescript
reset()                        // Reset to default values
reset({ email: "new@email.com" }) // Reset with new values
```

### watch

```typescript
const email = watch("email")           // Watch single field
const allFields = watch()              // Watch all fields
const { email, password } = watch(["email", "password"])
```

### setValue

```typescript
setValue("email", "new@email.com")
setValue("email", "new@email.com", { shouldValidate: true })
```

### getValues

```typescript
const email = getValues("email")
const allValues = getValues()
```

### trigger

```typescript
trigger("email")               // Validate single field
trigger()                      // Validate all fields
```

### setError

```typescript
setError("email", {
  type: "manual",
  message: "Email already exists"
})
```

### clearErrors

```typescript
clearErrors("email")           // Clear single field error
clearErrors()                  // Clear all errors
```

---

## 🎨 FormState

```typescript
const { 
  errors,              // Validation errors
  isSubmitting,        // Form is submitting
  isSubmitted,         // Form has been submitted
  isValid,             // Form is valid
  isDirty,             // Form has been modified
  dirtyFields,         // Which fields are dirty
  touchedFields,       // Which fields have been touched
  isValidating,        // Async validation in progress
  submitCount,         // Number of submit attempts
} = formState;
```

---

## ⚠️ Error Handling

### Display Errors

```typescript
{errors.email && (
  <p className="error">
    {errors.email.message}
  </p>
)}

{errors.email?.type === "required" && <p>Required</p>}
{errors.email?.type === "pattern" && <p>Invalid format</p>}
```

### Error Types

```typescript
type FieldError = {
  type: string;
  message?: string;
  ref?: Ref;
}
```

---

## ♿ Accessibility

### ARIA Attributes

```typescript
<input
  {...register("email")}
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? "email-error" : undefined}
/>
{errors.email && (
  <p id="email-error" role="alert">
    {errors.email.message}
  </p>
)}
```

### Labels

```typescript
<label htmlFor="email">Email</label>
<input id="email" {...register("email")} />
```

---

## 🔧 Advanced Patterns

### Dynamic Fields

```typescript
const { fields, append, remove } = useFieldArray({
  control,
  name: "items"
});

{fields.map((field, index) => (
  <div key={field.id}>
    <input {...register(`items.${index}.name`)} />
    <button onClick={() => remove(index)}>Remove</button>
  </div>
))}
<button onClick={() => append({ name: "" })}>Add</button>
```

### Conditional Fields

```typescript
const showAdditional = watch("showMore");

{showAdditional && (
  <input {...register("additionalInfo")} />
)}
```

### File Upload

```typescript
<input
  type="file"
  {...register("file")}
  accept="image/*"
/>

const file = watch("file")?.[0];
```

### Controlled Components

```typescript
import { Controller } from "react-hook-form";

<Controller
  name="reactSelect"
  control={control}
  render={({ field }) => (
    <ReactSelect {...field} options={options} />
  )}
/>
```

---

## 📊 Performance Tips

### 1. Use `mode: "onBlur"`
```typescript
useForm({ mode: "onBlur" }) // Better UX, less re-renders
```

### 2. Avoid Watch in Render
```typescript
// ❌ Bad
const values = watch();

// ✅ Good
const email = watch("email");
```

### 3. Use shouldUnregister
```typescript
useForm({ shouldUnregister: true }) // Cleanup on unmount
```

### 4. Optimize Validation
```typescript
// ❌ Avoid complex sync in schema
z.string().refine(expensiveSync)

// ✅ Use async or defer
z.string().refine(async (val) => await check(val))
```

---

## 🐛 Common Issues

### Issue: "resolver is not a function"
```bash
npm install @hookform/resolvers
```

### Issue: TypeScript errors
```typescript
// Ensure type is derived from schema
type FormData = z.infer<typeof schema>;
const { register } = useForm<FormData>({...});
```

### Issue: Optional fields showing errors
```typescript
// Use optional or empty string
z.string().optional()
z.string().or(z.literal(""))
```

### Issue: Multiple validation errors
```typescript
useForm({ criteriaMode: "all" })
```

---

## ✅ Checklist

- [ ] Schema defined with clear error messages
- [ ] Types derived with `z.infer<typeof schema>`
- [ ] useForm configured with zodResolver
- [ ] All fields registered
- [ ] Error messages displayed
- [ ] Submit handler implemented
- [ ] Loading states handled
- [ ] Accessibility attributes added
- [ ] Form resets after success
- [ ] Console logging for debugging

---

## 📚 Resources

- [React Hook Form Docs](https://react-hook-form.com)
- [Zod Docs](https://zod.dev)
- [Form Validation Examples](https://react-hook-form.com/form-builder)

---

**Pro Tip:** Use `mode: "onBlur"` for the best user experience — it validates after users leave a field, not while they're typing!
