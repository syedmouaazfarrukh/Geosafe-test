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

