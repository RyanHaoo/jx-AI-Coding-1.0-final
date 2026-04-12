import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearIdentityCookie } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearIdentityCookie();
  revalidatePath("/", "layout");
  redirect("/login");
}
