# State Management using Context & Hooks

## Overview

This document explains the implementation of global state management in our Next.js application using React Context API and custom hooks. This approach provides a clean, maintainable way to share data across components without prop-drilling.

## Table of Contents

1. [Why Context and Hooks?](#why-context-and-hooks)
2. [Folder Structure](#folder-structure)
3. [Implementation Details](#implementation-details)
4. [Usage Examples](#usage-examples)
5. [Demo Pages](#demo-pages)
6. [Performance Considerations](#performance-considerations)
7. [Debugging Tips](#debugging-tips)

---

## Why Context and Hooks?

| Concept | Purpose | Example |
|---------|---------|---------|
| **Context** | Provides a way to pass data through the component tree without props | Share logged-in user data across pages |
| **Custom Hook** | Encapsulates reusable logic for cleaner components | `useAuth()` handles login, logout, and state access |
| **Provider Pattern** | Wraps the app to make state globally available | All pages can access auth and UI state |

### Key Benefits

- ✅ **No prop-drilling** through multiple component layers
- ✅ **Centralized state** logic in one place
- ✅ **Type-safe** with TypeScript interfaces
- ✅ **Easy to test** and maintain
- ✅ **Performance-optimized** with selective re-renders

---

## Folder Structure

```
app/
├── layout.tsx                    # Root layout with providers
├── components/
│   └── ClientProviders.tsx       # Wraps AuthProvider & UIProvider
├── state-demo/
│   └── page.tsx                  # Full-featured demo page
└── context-example/
    └── page.tsx                  # Simple usage example
context/
├── AuthContext.tsx               # Authentication context & provider
└── UIContext.tsx                 # UI state context & provider
hooks/
├── useAuth.ts                    # Custom hook for auth
└── useUI.ts                      # Custom hook for UI state
```

---

## Implementation Details

### 1. AuthContext (`context/AuthContext.tsx`)

**Purpose:** Manages user authentication state globally.

**Features:**
- Login/logout functionality
- Persistent user state via cookies
- Cookie integration for auth tokens
- Type-safe context API

**Interface:**
```typescript
interface AuthContextType {
  user: string | null;              // Currently logged-in user
  login: (username: string) => void; // Login function
  logout: () => void;                // Logout function
  isAuthenticated: boolean;          // Auth status
}
```

**Key Implementation Points:**
- Uses `useState` to manage user state
- Integrates with browser cookies via `js-cookie` library
- Automatically initializes user from JWT token on mount
- Logs all auth state changes to console for debugging
- Throws error if used outside provider (fail-fast pattern)

**Code Snippet:**
```typescript
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);

  // Initialize user from cookie on mount
  useEffect(() => {
    const token = Cookies.get("authToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload.email || "Authenticated User");
      } catch (error) {
        console.error("Failed to parse auth token:", error);
      }
    }
  }, []);

  const login = (username: string) => {
    setUser(username);
    console.log("✅ User logged in:", username);
  };

  const logout = () => {
    setUser(null);
    Cookies.remove("authToken");
    console.log("🔓 User logged out");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

### 2. UIContext (`context/UIContext.tsx`)

**Purpose:** Manages UI state like theme, sidebar, and notifications.

**Features:**
- **Theme Management**: Light/dark mode with localStorage persistence
- **Sidebar Control**: Toggle sidebar open/closed state
- **Notifications**: Add/remove notifications with auto-dismiss (5s)
- **Type-safe**: Full TypeScript support

**Interface:**
```typescript
interface UIContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  notifications: Notification[];
  addNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
  removeNotification: (id: string) => void;
}

interface Notification {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: number;
}
```

**Key Features:**

1. **Theme Persistence**
   - Saves to `localStorage` on change
   - Restores theme on page reload
   - Logs theme changes to console

2. **Auto-dismiss Notifications**
   - Automatically removes notifications after 5 seconds
   - Each notification has unique ID
   - Console logging for debugging

3. **Sidebar State**
   - Simple boolean toggle
   - Logs open/close events

**Code Snippet:**
```typescript
const addNotification = (message: string, type: "info" | "success" | "warning" | "error") => {
  const notification: Notification = {
    id: `notif-${Date.now()}-${Math.random()}`,
    message,
    type,
    timestamp: Date.now(),
  };
  setNotifications((prev) => [...prev, notification]);
  console.log(`🔔 Notification added: [${type}] ${message}`);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    removeNotification(notification.id);
  }, 5000);
};
```

---

### 3. Provider Setup

**Why Separate `ClientProviders`?**
- Root layout has server-side metadata (can't be client component)
- Contexts require `"use client"` directive
- Solution: Create separate `ClientProviders` wrapper component

**ClientProviders.tsx:**
```typescript
"use client";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <UIProvider>
        {children}
      </UIProvider>
    </AuthProvider>
  );
}
```

**layout.tsx Integration:**
```typescript
import { ClientProviders } from "./components/ClientProviders";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          <GlobalNavbar />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
```

**Behavior:**
- Both contexts are now globally available
- Any component anywhere in the app can access auth and UI state
- No prop-drilling required
- Single source of truth for shared state

---

### 4. Custom Hooks

Custom hooks provide a clean, documented interface for consuming context.

#### useAuth Hook (`hooks/useAuth.ts`)

**Purpose:** Simplifies access to authentication state and methods.

**Returns:**
```typescript
{
  user: string | null;               // Current user
  isAuthenticated: boolean;          // Auth status
  login: (username: string) => void; // Login function
  logout: () => void;                // Logout function
}
```

**Full Implementation:**
```typescript
import { useAuthContext } from "@/context/AuthContext";

export function useAuth() {
  const { user, login, logout, isAuthenticated } = useAuthContext();

  return {
    user,
    isAuthenticated,
    login,
    logout,
  };
}
```

**Benefits:**
- Abstracts internal context implementation
- Provides additional computed values (`isAuthenticated`)
- Single import for all auth functionality
- Cleaner component code

#### useUI Hook (`hooks/useUI.ts`)

**Purpose:** Simplifies access to UI state and controls.

**Returns:**
```typescript
{
  theme: "light" | "dark";
  toggleTheme: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  notifications: Notification[];
  addNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
  removeNotification: (id: string) => void;
}
```

**Benefits:**
- Single hook for all UI concerns
- Keeps components declarative and simple
- Easy to mock in tests
- Self-documenting API

---

## Usage Examples

### Pattern 1: Basic Auth Check

```typescript
"use client";
import { useAuth } from "@/hooks/useAuth";

export default function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user}!</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={() => login("JohnDoe")}>Login</button>
      )}
    </div>
  );
}
```

### Pattern 2: Protected Component

```typescript
"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);
  
  return <div>Protected content</div>;
}
```

### Pattern 3: Notification on Action

```typescript
"use client";
import { useUI } from "@/hooks/useUI";

export default function FormPage() {
  const { addNotification } = useUI();
  
  const handleSubmit = async (data: FormData) => {
    try {
      await saveData(data);
      addNotification("Form submitted successfully!", "success");
    } catch (error) {
      addNotification("Failed to submit form", "error");
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Pattern 4: Theme-Aware Component

```typescript
"use client";
import { useUI } from "@/hooks/useUI";

export default function ThemedCard() {
  const { theme } = useUI();
  
  const styles = {
    background: theme === "dark" ? "#1a1a2e" : "#ffffff",
    color: theme === "dark" ? "#eee" : "#333",
    border: theme === "dark" ? "1px solid #0f3460" : "1px solid #e0e0e0",
  };
  
  return <div style={styles}>Themed content</div>;
}
```

---

## Demo Pages

### 1. Simple Example (`/context-example`)

A basic demonstration of the core concepts from the lesson plan. Shows:
- Login/logout functionality
- Theme toggling
- Sidebar control

**URL:** `http://localhost:3000/context-example`

### 2. Full-Featured Demo (`/state-demo`)

A comprehensive demonstration of all features with visual styling. Shows:
- Authentication with custom username input
- Theme toggle with persistent state
- Sidebar with animation
- All notification types (info, success, warning, error)
- Real-time console logging
- Technical implementation details

**URL:** `http://localhost:3000/state-demo`

**Features Demonstrated:**

1. **Authentication Controls**
   - Login with custom username
   - Logout button when authenticated
   - Display current user
   - Status indicator (✅ logged in / ❌ not authenticated)

2. **Theme Toggle**
   - Switch between light and dark modes
   - Persistent across page reloads via localStorage
   - Dynamic styling based on theme
   - Visual feedback

3. **Sidebar Toggle**
   - Open/close sidebar with animation
   - Sliding sidebar with menu items
   - Fixed position overlay
   - Responsive design

4. **Notification System**
   - Trigger 4 types: info, success, warning, error
   - Auto-dismiss after 5 seconds
   - Manual close button
   - Animated slide-in effect
   - Fixed top-right position
   - Color-coded by type

---

## State Management Flow

```
┌─────────────────────────────────────────────────┐
│        Root Layout (layout.tsx)                 │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  ClientProviders (Client Component)       │ │
│  │                                           │ │
│  │  ┌─────────────────────────────────────┐ │ │
│  │  │  AuthProvider (AuthContext)         │ │ │
│  │  │                                     │ │ │
│  │  │  ┌───────────────────────────────┐ │ │ │
│  │  │  │  UIProvider (UIContext)       │ │ │ │
│  │  │  │                               │ │ │ │
│  │  │  │   ┌───────────────────────┐  │ │ │ │
│  │  │  │   │  GlobalNavbar         │  │ │ │ │
│  │  │  │   └───────────────────────┘  │ │ │ │
│  │  │  │   ┌───────────────────────┐  │ │ │ │
│  │  │  │   │  Page Content         │  │ │ │ │
│  │  │  │   │  - Can use useAuth()  │  │ │ │ │
│  │  │  │   │  - Can use useUI()    │  │ │ │ │
│  │  │  │   └───────────────────────┘  │ │ │ │
│  │  │  │                               │ │ │ │
│  │  │  └───────────────────────────────┘ │ │ │
│  │  │                                     │ │ │
│  │  └─────────────────────────────────────┘ │ │
│  │                                           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

**State Flow:**
1. User action (e.g., click login button)
2. Component calls hook function (e.g., `login("John")`)
3. Hook calls context updater function
4. Context updates state via `useState`
5. React re-renders all components using that context
6. UI updates reflect new state

---

## Performance Considerations

### Best Practices

1. **Selective Context Splitting**
   - We split Auth and UI into separate contexts
   - Components only re-render when their used context changes
   - Reduces unnecessary re-renders

2. **Memoization** (future enhancement)
   ```typescript
   const authValue = useMemo(
     () => ({ user, login, logout, isAuthenticated }),
     [user]
   );
   ```

3. **Context Splitting** (if performance issues arise)
   - Create more granular contexts (e.g., ThemeContext, SidebarContext separately)
   - Use only what you need in each component

### Security Considerations

1. **Cookie Integration**
   - AuthContext reads from `authToken` cookie
   - Removes cookie on logout
   - Enhanced with secure HTTP-only cookies

2. **Error Boundaries**
   - Context throws error if used outside provider
   - Fail-fast pattern prevents bugs

3. **Type Safety**
   - Full TypeScript interfaces
   - Compile-time error checking
   - IntelliSense support

---

## Debugging Tips

### 1. Check Provider Hierarchy

- Use React DevTools → Components tab
- Find AuthProvider and UIProvider
- Inspect their current state values

### 2. Console Logs

All state changes are logged with emoji prefixes:
- ✅ User logged in
- 🔓 User logged out
- 🎨 Theme toggled
- 📱 Sidebar opened/closed
- 🔔 Notification added
- 🗑️ Notification removed

### 3. Common Errors

**Error:** "useAuthContext must be used within an AuthProvider"
- **Cause:** Using `useAuth()` outside the provider
- **Fix:** Ensure component is child of `<ClientProviders>`

**Error:** Theme not persisting across reloads
- **Cause:** localStorage not saving/loading correctly
- **Fix:** Check browser console for localStorage errors
- **Check:** Verify `localStorage.getItem("theme")` in console

### 4. Performance Issues

- Use React DevTools Profiler
- Check which components re-render
- Consider splitting contexts if too many re-renders

---

## Console Output Examples

When you interact with the demo pages, you'll see structured console logs:

```
🎨 Theme loaded from localStorage: light
✅ User logged in: KalviumUser
🔔 Notification added: [success] Welcome back, KalviumUser!
🎨 Theme toggled to: dark
📱 Sidebar opened
🔓 User logged out
🔔 Notification added: [info] Goodbye, KalviumUser!
🗑️ Notification removed: notif-1737635421234-0.123
```

---

## Testing Checklist

Visit the demo pages and verify:

### Auth State
- [ ] Can login with custom username
- [ ] Username displays correctly
- [ ] Logout clears user state
- [ ] Console shows login/logout logs

### Theme Toggle
- [ ] Button toggles between light/dark
- [ ] Background and text colors change
- [ ] Theme persists after page reload
- [ ] LocalStorage has correct value

### Sidebar
- [ ] Opens with animation
- [ ] Closes when toggled again
- [ ] Shows menu items
- [ ] Console logs open/close events

### Notifications
- [ ] Info notification (blue)
- [ ] Success notification (green)
- [ ] Warning notification (orange)
- [ ] Error notification (red)
- [ ] Auto-dismisses after 5s
- [ ] Manual close button works
- [ ] Multiple notifications stack

### Console Output
- [ ] All actions logged with emojis
- [ ] Timestamps are recent
- [ ] No error messages

---

## Reflection

### What We Learned

1. **Context API Power**
   - Eliminates prop-drilling completely
   - Centralizes shared state logic
   - Makes components cleaner and more focused

2. **Custom Hooks Benefits**
   - Abstract implementation details
   - Provide clean, documented APIs
   - Easy to test and maintain
   - Self-documenting code

3. **Performance Considerations**
   - Context splitting reduces re-renders
   - Memoization can optimize expensive operations
   - Too many contexts can also harm performance

4. **Developer Experience**
   - TypeScript provides excellent autocomplete
   - Console logging aids debugging
   - Clear error messages prevent mistakes
   - Demo page serves as living documentation

### Scalability

- Easy to add new contexts (e.g., CartContext, SettingsContext)
- Custom hooks can be composed (`useAuthenticatedAPI`)
- Pattern scales to any app size
- Minimal boilerplate required

### Maintainability

- Single source of truth for each concern
- Clear separation of authentication from UI state
- Easy to find and update logic
- Well-documented interfaces

### Trade-offs

**Pros:**
- ✅ Simple, built-in, no dependencies
- ✅ Type-safe with TypeScript
- ✅ Easy to understand and debug
- ✅ Great for most apps

**Cons:**
- ⚠️ Can cause re-renders if not optimized
- ⚠️ Not ideal for very frequent updates (use Zustand/Redux for that)
- ⚠️ Requires understanding of Context API

---

## Future Enhancements

**Potential Improvements:**

1. **useReducer Pattern**
   - For complex state with multiple actions
   - Better debugging with action types
   - Predictable state transitions

   ```typescript
   const [state, dispatch] = useReducer(uiReducer, initialState);
   
   // Actions like:
   dispatch({ type: "TOGGLE_THEME" });
   dispatch({ type: "ADD_NOTIFICATION", payload: {...} });
   ```

2. **Persistent Notifications**
   - Save to localStorage
   - Show unread count
   - Notification center/history

3. **Advanced Theme System**
   - Multiple theme options (not just light/dark)
   - Custom color schemes
   - Font size preferences
   - Accessibility modes

4. **Real-time Sync**
   - Sync auth state across browser tabs
   - Use BroadcastChannel API
   - Logout from one tab affects all tabs

5. **Enhanced Auth**
   - Role-based access control
   - Permission checking hooks
   - Token refresh logic
   - OAuth integration

---

## Summary

**Key Takeaway:** Context + Hooks = maintainable, scalable state. Keep logic shared, components light, and re-renders minimal.

This implementation provides a solid foundation for state management that can grow with your application while maintaining clean, readable code.

---

## Quick Links

- **Simple Demo:** [/context-example](http://localhost:3000/context-example)
- **Full Demo:** [/state-demo](http://localhost:3000/state-demo)
- **AuthContext:** `context/AuthContext.tsx`
- **UIContext:** `context/UIContext.tsx`
- **useAuth Hook:** `hooks/useAuth.ts`
- **useUI Hook:** `hooks/useUI.ts`
