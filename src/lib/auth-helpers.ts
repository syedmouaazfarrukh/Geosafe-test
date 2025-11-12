import { Session } from "next-auth";

/**
 * Helper function to safely get user role from session
 * This ensures type safety across the application
 */
export function getUserRole(session: Session | null): string | undefined {
  if (!session?.user) return undefined;
  return (session.user as { role?: string })?.role;
}

/**
 * Check if user is admin
 */
export function isAdmin(session: Session | null): boolean {
  return getUserRole(session) === "ADMIN";
}

/**
 * Get user ID from session safely
 * Throws if session is null (should be called after isAdmin check)
 */
export function getUserId(session: Session | null): string {
  if (!session?.user?.id) {
    throw new Error("Session or user ID is missing");
  }
  return session.user.id;
}

