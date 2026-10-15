import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types/database";
import { hasPermission } from "@/lib/utils";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored when called from a Server Component
          }
        },
      },
    }
  );
}

/**
 * Strictly server-only Supabase client using Service Role Key.
 * Never import this in any Client Component.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL on server.");
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Server-enforced RBAC guard for Admin Pages and Server Actions.
 */
export async function requireStaffPermission(requiredPermission = "dashboard.view") {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone_number, role, is_active")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    !profile.is_active ||
    profile.role === "customer" ||
    !hasPermission(profile.role as UserRole, requiredPermission)
  ) {
    redirect("/");
  }

  return {
    user,
    profile: profile as {
      id: string;
      full_name: string;
      phone_number: string | null;
      role: UserRole;
      is_active: boolean;
    },
  };
}
