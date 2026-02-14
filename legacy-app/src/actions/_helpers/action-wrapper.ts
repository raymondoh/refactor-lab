// src/actions/_helpers/action-wrapper.ts
import { auth } from "@/auth";
import { fail, ServiceResult } from "@/lib/services/service-result";

/**
 * A wrapper for admin-only Server Actions.
 * It ensures the user is authenticated and has the 'admin' role.
 */
export function validatedAdminAction<T, R>(action: (data: T, userId: string) => Promise<ServiceResult<R>>) {
  return async (data: T): Promise<ServiceResult<R>> => {
    try {
      const session = await auth();

      if (!session?.user?.id) {
        return fail("UNAUTHENTICATED", "You must be logged in to perform this action.");
      }

      if (session.user.role !== "admin") {
        return fail("FORBIDDEN", "Admin privileges required.");
      }

      // Execute the actual action logic
      return await action(data, session.user.id);
    } catch (error) {
      console.error("[ACTION_WRAPPER_ERROR]", error);
      return fail("UNKNOWN", "An unexpected error occurred during the action.");
    }
  };
}
