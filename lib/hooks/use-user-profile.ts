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
        setLoading(false);
        return;
      }

      // Fetch app user profile
      const { data: appUser, error: appUserError } = await supabase
        .from("app_users")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (appUser && !appUserError) {
        setProfile(appUser as AppUser);

        // Fetch user roles
        const { data: userRoles, error: rolesError } = await supabase
          .from("user_roles")
          .select(
            `
            role:roles(name, description),
            organization:organizations(name)
          `
          )
          .eq("user_id", (appUser as AppUser).id);

        if (userRoles && !rolesError) {
          setRoles(userRoles as unknown as UserRole[]);
        }
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
