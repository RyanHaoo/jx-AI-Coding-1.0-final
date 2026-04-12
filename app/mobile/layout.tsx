import { MobileLayoutClient } from "@/components/mobile-layout-client";
import { getIdentitiesForUser, getIdentityFromCookie } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { IdentityOption } from "@/lib/types";

export default async function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userName = "";
  let department = "";
  let projectName = "";
  let role = "";
  let identities: IdentityOption[] = [];

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, department")
      .eq("id", user.id)
      .single();

    if (profile) {
      userName = profile.name;
      department = profile.department;
    }

    const identity = await getIdentityFromCookie();
    if (identity) {
      projectName = identity.projectName;
      role = identity.role;
    }

    identities = await getIdentitiesForUser(user.id);
  }

  return (
    <MobileLayoutClient
      userName={userName}
      department={department}
      projectName={projectName}
      role={role}
      identities={identities}
    >
      {children}
    </MobileLayoutClient>
  );
}
