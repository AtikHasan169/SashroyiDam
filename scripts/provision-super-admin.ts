import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function provisionSuperAdmin() {
  const email = process.env.INITIAL_SUPER_ADMIN_EMAIL || "admin@sashroyidaam.com";
  const password = process.env.INITIAL_SUPER_ADMIN_PASSWORD || "SashroyiDamAdmin!2026";
  const phone = process.env.INITIAL_SUPER_ADMIN_PHONE || "01700000000";

  console.log(`🔐 Provisioning Super Admin for Sashroyi Daam: ${email}`);

  // 1. Create auth user via admin API
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError && !authError.message.includes("already registered")) {
    console.error("❌ Failed to create auth user:", authError.message);
    process.exit(1);
  }

  let targetId = authData?.user?.id;

  if (!targetId) {
    const { data: listData } = await adminSupabase.auth.admin.listUsers();
    const existing = listData?.users?.find((u) => u.email === email);
    if (existing) {
      targetId = existing.id;
    }
  }

  if (!targetId) {
    console.error("❌ Could not find user.");
    process.exit(1);
  }

  // 2. Upsert profile with super_admin role
  const { error: profileError } = await adminSupabase.from("profiles").upsert({
    id: targetId,
    full_name: "Sashroyi Daam Super Admin",
    phone_number: phone,
    email,
    role: "super_admin",
    is_active: true,
  });

  if (profileError) {
    console.error("❌ Failed to update profile role:", profileError.message);
    process.exit(1);
  }

  console.log("✅ Super Admin successfully provisioned for সাশ্রয়ী দাম (SashroyiDam)!");
}

provisionSuperAdmin();
