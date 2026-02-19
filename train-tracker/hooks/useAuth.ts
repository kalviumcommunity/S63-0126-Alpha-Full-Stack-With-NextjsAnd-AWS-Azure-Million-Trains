import { useAuthContext } from "@/context/AuthContext";

/**
 * Custom hook for authentication
 * Provides a clean interface for auth operations
 */
export function useAuth() {
  const { user, login, logout, isAuthenticated } = useAuthContext();

  return {
    /** Current logged-in user (null if not authenticated) */
    user,
    /** Whether the user is currently authenticated */
    isAuthenticated,
    /** Log in with a username */
    login,
    /** Log out the current user */
    logout,
  };
}
