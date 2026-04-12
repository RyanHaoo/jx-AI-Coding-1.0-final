"use server";

import { revalidatePath } from "next/cache";
import { writeIdentityCookie } from "@/lib/auth";
import type { Role } from "@/lib/types";

export async function switchIdentity(
  projectId: number,
  projectName: string,
  role: Role,
) {
  await writeIdentityCookie(projectId, projectName, role);
  revalidatePath("/", "layout");
}
