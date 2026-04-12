"use server";

import { revalidatePath } from "next/cache";
import { getIdentitiesForUser, writeIdentityCookie } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LoginResult, Role } from "@/lib/types";

function getDefaultRedirect(role: string): string {
  return role === "管理员" ? "/dashboard/overview" : "/mobile/assistant";
}

export async function login(formData: FormData): Promise<LoginResult> {
  const number = formData.get("number") as string;
  const password = formData.get("password") as string;
  const redirectPath = (formData.get("redirect") as string) || "";

  if (!number || !password) {
    return { success: false, error: "请输入工号和密码" };
  }

  const supabase = await createClient();

  // 1. Lookup profile by worker number to get auth_email
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, auth_email")
    .eq("number", number)
    .single();

  if (profileError || !profile?.auth_email) {
    return { success: false, error: "工号或密码错误" };
  }

  // 2. Sign in with email + password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: profile.auth_email,
    password,
  });

  if (signInError) {
    return { success: false, error: "工号或密码错误" };
  }

  // 3. Query identities for this user
  const identities = await getIdentitiesForUser(profile.id);

  if (identities.length === 0) {
    return { success: false, error: "该账号没有关联的项目角色" };
  }

  if (identities.length === 1) {
    // Single identity: auto-select
    const identity = identities[0];
    await writeIdentityCookie(
      identity.projectId,
      identity.projectName,
      identity.role,
    );

    const redirectUrl = redirectPath || getDefaultRedirect(identity.role);

    return { success: true, redirectUrl };
  }

  // Multiple identities: need selection
  return { success: true, needsIdentitySelect: true, identities };
}

export async function selectIdentity(formData: FormData): Promise<void> {
  const projectId = formData.get("projectId") as string;
  const projectName = formData.get("projectName") as string;
  const role = formData.get("role") as string;

  await writeIdentityCookie(Number(projectId), projectName, role as Role);
  revalidatePath("/", "layout");
}
