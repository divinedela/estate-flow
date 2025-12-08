"use client";

import { useUser } from "@/lib/contexts/user-context";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallback,
}: RoleGuardProps) {
  const { roles, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Debug logging
  console.log("[RoleGuard] Checking access:", {
    allowedRoles,
    userRoles: roles.map((ur) => ur.role?.name),
    rolesCount: roles.length,
  });

  const hasAccess = roles.some((ur) => ur.role && allowedRoles.includes(ur.role.name));

  if (!hasAccess) {
    console.warn(
      "[RoleGuard] Access denied. Required:",
      allowedRoles,
      "User has:",
      roles.map((ur) => ur.role?.name)
    );
    return (
      fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">
            You don't have permission to access this resource.
          </p>
          <p className="text-red-600 text-sm mt-2">
            Required roles: {allowedRoles.join(", ")}
          </p>
          <p className="text-red-600 text-sm">
            Your roles:{" "}
            {roles.length > 0
              ? roles.map((ur) => ur.role?.name).join(", ")
              : "None"}
          </p>
        </div>
      )
    );
  }

  return <>{children}</>;
}
