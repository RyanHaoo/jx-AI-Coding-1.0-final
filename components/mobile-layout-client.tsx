"use client";

import { useState } from "react";
import { MobileSideDrawer } from "@/components/mobile-side-drawer";
import { MobileTopBar } from "@/components/mobile-top-bar";
import type { IdentityOption } from "@/lib/types";

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

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <MobileTopBar
        title="建筑施工质检情报员"
        onMenuClick={() => setDrawerOpen(true)}
      />
      <MobileSideDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        userName={userName}
        department={department}
        projectName={projectName}
        role={role}
        identities={identities}
      />
      <main className="flex-1 bg-zinc-50 p-4">{children}</main>
    </div>
  );
}
