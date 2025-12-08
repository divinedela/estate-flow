"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";

type AppUser = Database["public"]["Tables"]["app_users"]["Row"];
type UserRole = {
  role: {
    name: string;
    description: string | null;
  };
  organization: {
    name: string;
  } | null;
};

export function useUserProfile() {
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log("[useUserProfile] No auth user found");
        setLoading(false);
        return;
      }

      console.log("[useUserProfile] Auth user:", user.id, user.email);

      // Fetch app user profile
      const { data: appUser, error: appUserError } = await supabase
        .from("app_users")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (appUserError) {
        console.error(
          "[useUserProfile] Error fetching app user:",
          appUserError
        );
        setLoading(false);
        return;
      }

      if (!appUser) {
        console.warn(
          "[useUserProfile] No app_user record found for user:",
          user.id
        );
        setLoading(false);
        return;
      }

      const typedAppUser = appUser as AppUser;
      console.log(
        "[useUserProfile] App user found:",
        typedAppUser.id,
        typedAppUser.email
      );
      setProfile(typedAppUser);

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select(
          `
          role:roles(name, description),
          organization:organizations(name)
        `
        )
        .eq("user_id", typedAppUser.id);

      if (rolesError) {
        console.error("[useUserProfile] Error fetching roles:", rolesError);
        setRoles([]);
      } else if (userRoles && Array.isArray(userRoles)) {
        console.log("[useUserProfile] Roles fetched:", userRoles);
        console.log(
          "[useUserProfile] Role details:",
          userRoles.map((ur: any) => ({
            roleName: ur.role?.name,
            organization: ur.organization?.name,
          }))
        );
        setRoles(userRoles as unknown as UserRole[]);
      } else {
        console.warn("[useUserProfile] No roles found for user");
        setRoles([]);
      }

      setLoading(false);
    }

    fetchProfile();
  }, []);

  const hasRole = (roleName: string) => {
    return roles.some((ur) => ur.role.name === roleName);
  };

  const isSuperAdmin = () => {
    return hasRole("super_admin");
  };

  return { profile, roles, loading, hasRole, isSuperAdmin };
}
