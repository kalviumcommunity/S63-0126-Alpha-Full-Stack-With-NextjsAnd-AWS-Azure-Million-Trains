# Component Quick Reference Guide

## Import Components

```tsx
// Import from root (recommended)
import { Button, Card, InputField, Badge, Modal, Alert } from "@/components";
import { Header, Sidebar, LayoutWrapper } from "@/components";

// Or import from category
import { Button, Card } from "@/components/ui";
import { Header, Sidebar } from "@/components/layout";
```

## Layout Components

### LayoutWrapper - Choose Your Layout

```tsx
// Header only (public pages)
<LayoutWrapper variant="default">
  {children}
</LayoutWrapper>

// Header + Sidebar (dashboards)
<LayoutWrapper variant="dashboard">
  {children}
</LayoutWrapper>

// No navigation (login, landing)
<LayoutWrapper variant="minimal">
  {children}
</LayoutWrapper>
```

## UI Components - Quick Copy-Paste Examples

### Button

```tsx
// Primary action
<Button label="Save Changes" variant="primary" />

// Danger action
<Button label="Delete" variant="danger" icon="🗑️" />

// Loading state
<Button label="Submitting..." loading={true} />

// Full width
<Button label="Sign Up" variant="primary" fullWidth />

// Small size
<Button label="Learn More" variant="outline" size="small" />
```

### Card

```tsx
// Simple card
<Card padding="medium">
  <p>Your content here</p>
</Card>

// Card with header and actions
<Card 
  title="Settings" 
  subtitle="Manage your preferences"
  variant="elevated"
  headerAction={<Button label="Save" size="small" />}
>
  <p>Card content</p>
</Card>

// Card with footer
<Card
  title="Confirm"
  footer={
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <Button label="Cancel" variant="outline" size="small" />
      <Button label="OK" variant="primary" size="small" />
    </div>
  }
>
  <p>Are you sure?</p>
</Card>
```

### InputField

```tsx
// Basic input
<InputField 
  label="Email" 
  type="email" 
  placeholder="your@email.com"
  fullWidth
/>

// With icon
<InputField 
  label="Username" 
  icon="👤" 
  placeholder="username"
  fullWidth
/>

// With error
<InputField 
  label="Password" 
  type="password"
  error="Password is required"
  fullWidth
/>

// With helper text
<InputField 
  label="Phone" 
  helperText="Format: (123) 456-7890"
  fullWidth
/>
```

### Badge

```tsx
// Success badge
<Badge label="Active" variant="success" />

// Warning badge
<Badge label="Pending" variant="warning" />

// Danger badge
<Badge label="Error" variant="danger" />

// Small role badge
<Badge label="Admin" variant="primary" size="small" />
```

### Alert

```tsx
// Info alert
<Alert type="info" title="Note">
  This is an informational message.
</Alert>

// Success alert
<Alert type="success" title="Success!">
  Changes saved successfully.
</Alert>

// Error alert with close
<Alert 
  type="error" 
  title="Error" 
  onClose={() => setShowAlert(false)}
>
  Something went wrong.
</Alert>
```

### Modal

```tsx
function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        label="Open Dialog" 
        onClick={() => setIsOpen(true)} 
      />
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Dialog Title"
        size="medium"
        footer={
          <>
            <Button 
              label="Cancel" 
              variant="outline"
              onClick={() => setIsOpen(false)} 
            />
            <Button 
              label="Confirm" 
              variant="primary"
              onClick={handleConfirm} 
            />
          </>
        }
      >
        <p>Dialog content here</p>
      </Modal>
    </>
  );
}
```

## Common Patterns

### Form with Validation

```tsx
import { Card, InputField, Button, Alert } from "@/components";
import { useState } from "react";

export default function ContactForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    if (!email.includes("@")) {
      setError("Invalid email");
      return;
    }
    setSuccess(true);
  };

  return (
    <Card title="Contact Us" variant="elevated">
      {success && (
        <Alert type="success" onClose={() => setSuccess(false)}>
          Message sent!
        </Alert>
      )}
      
      <InputField 
        label="Email" 
        icon="📧"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
        fullWidth
      />
      
      <Button 
        label="Submit" 
        variant="primary" 
        onClick={handleSubmit}
        fullWidth
      />
    </Card>
  );
}
```

### Dashboard Stats

```tsx
import { Card } from "@/components";

export default function DashboardStats() {
  const stats = [
    { icon: "👥", value: "1,234", label: "Users" },
    { icon: "🚂", value: "567", label: "Trains" },
    { icon: "📈", value: "89%", label: "Uptime" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
      {stats.map((stat) => (
        <Card key={stat.label} variant="elevated" padding="medium">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "2.5rem" }}>{stat.icon}</span>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: 700 }}>{stat.value}</div>
              <div style={{ color: "#6b7280" }}>{stat.label}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

### Confirmation Dialog

```tsx
import { Button, Modal } from "@/components";
import { useState } from "react";

export default function DeleteButton({ onDelete, itemName }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    onDelete();
    setShowConfirm(false);
  };

  return (
    <>
      <Button 
        label="Delete" 
        variant="danger" 
        icon="🗑️"
        onClick={() => setShowConfirm(true)}
      />
      
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Delete"
        size="small"
        footer={
          <>
            <Button 
              label="Cancel" 
              variant="outline"
              onClick={() => setShowConfirm(false)} 
            />
            <Button 
              label="Delete" 
              variant="danger"
              onClick={handleDelete} 
            />
          </>
        }
      >
        <p>Are you sure you want to delete <strong>{itemName}</strong>?</p>
        <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
          This action cannot be undone.
        </p>
      </Modal>
    </>
  );
}
```

### User Profile Card

```tsx
import { Card, Badge, Button } from "@/components";

export default function UserProfileCard({ user }) {
  return (
    <Card variant="elevated">
      <div style={{ textAlign: "center" }}>
        {/* Avatar */}
        <div style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #2563eb 0%, #93c5fd 100%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2.5rem",
          fontWeight: "bold",
          margin: "0 auto 1rem",
        }}>
          {user.name.charAt(0)}
        </div>

        {/* Name & Role */}
        <h2 style={{ margin: "0 0 0.5rem 0" }}>{user.name}</h2>
        <Badge label={user.role} variant="primary" />

        {/* Email */}
        <p style={{ color: "#6b7280", margin: "1rem 0" }}>{user.email}</p>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
          <Button label="View Profile" variant="primary" fullWidth />
          <Button label="Message" variant="outline" fullWidth />
        </div>
      </div>
    </Card>
  );
}
```

## Color Reference

```tsx
// Primary
#2563eb  // Buttons, links, accents

// Success
#10b981  // Success states, confirmations

// Warning
#f59e0b  // Warnings, cautions

// Danger
#ef4444  // Errors, destructive actions

// Info
#6366f1  // Informational states

// Grays
#1f2937  // Headings
#374151  // Body text
#6b7280  // Secondary text
#9ca3af  // Disabled text
#e5e7eb  // Borders
#f9fafb  // Backgrounds
```

## Size Reference

### Buttons
- `small`: 0.375rem × 0.75rem padding, 0.875rem font
- `medium`: 0.5rem × 1.25rem padding, 0.95rem font
- `large`: 0.75rem × 1.75rem padding, 1.1rem font

### Badges
- `small`: 0.25rem × 0.5rem padding, 0.7rem font
- `medium`: 0.375rem × 0.75rem padding, 0.8rem font
- `large`: 0.5rem × 1rem padding, 0.9rem font

### Cards
- `none`: 0 padding
- `small`: 1rem padding
- `medium`: 1.5rem padding
- `large`: 2rem padding

### Modals
- `small`: 400px max-width
- `medium`: 600px max-width
- `large`: 900px max-width
- `fullscreen`: 95vw max-width

## Tips & Best Practices

### ✅ DO:
- Use barrel exports: `import { Button } from "@/components"`
- Provide labels for accessibility
- Use semantic variants (success for positive actions)
- Combine components (Card + InputField + Button)
- Use `fullWidth` for mobile-friendly forms

### ❌ DON'T:
- Import directly: `import Button from "@/components/ui/Button"`
- Override component styles from parent
- Mix too many variants in one view
- Forget error states and loading indicators
- Skip accessibility attributes

## Testing Pages

- **Component Showcase**: `/components-showcase`
- **Default Layout**: `/layout-examples/default-layout`
- **Dashboard Layout**: `/layout-examples/dashboard-layout`
- **Minimal Layout**: `/layout-examples/minimal-layout`

## Need Help?

1. Check the [Component Architecture Documentation](./COMPONENT_ARCHITECTURE.md)
2. Visit the [README Component Section](./Readme.md#layout-and-component-architecture)
3. View live examples at `/components-showcase`
4. Review code in `components/` directory

---

**Quick Start:** Copy any example above, adjust the props, and you're done! 🚀
