"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit-log";

export async function loginAction(email: string, password: string) {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  await writeAuditLog(supabase, {
    entityType: "auth",
    entityId: data.user?.id,
    action: "login",
    changes: { email },
  });

  return { success: true };
}

export async function logoutAction() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await writeAuditLog(supabase, {
    entityType: "auth",
    entityId: user?.id,
    action: "logout",
    changes: { email: user?.email || null },
  });

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
