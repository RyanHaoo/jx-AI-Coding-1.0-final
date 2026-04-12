"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { MobileSideDrawer } from "@/components/mobile-side-drawer";
import { MobileTopBar } from "@/components/mobile-top-bar";
import type { IdentityOption } from "@/lib/types";

const routeTitleMap: Record<string, string> = {
  "/mobile/assistant": "智能助手",
  "/mobile/tickets": "工单列表",
};

interface MobileLayoutClientProps {
  children: React.ReactNode;
  userName: string;
  department: string;
  projectName: string;
  role: string;
  identities: IdentityOption[];
}

export function MobileLayoutClient({
  children,
  userName,
  department,
  projectName,
  role,
  identities,
}: MobileLayoutClientProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  const title =
    routeTitleMap[pathname] ??
    Object.entries(routeTitleMap).find(([route]) =>
      pathname.startsWith(`${route}/`),
    )?.[1] ??
    "智能助手";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <MobileTopBar title={title} onMenuClick={() => setDrawerOpen(true)} />
      <MobileSideDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={title}
        userName={userName}
        department={department}
        projectName={projectName}
        role={role}
        identities={identities}
      />
      <main className="flex-1 bg-[var(--stitch-surface-container-lowest)] p-4">
        {children}
      </main>
    </div>
  );
}
