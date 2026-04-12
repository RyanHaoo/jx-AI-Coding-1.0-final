"use client";

import { useState } from "react";
import { MobileSideDrawer } from "@/components/mobile-side-drawer";
import { MobileTopBar } from "@/components/mobile-top-bar";

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <MobileTopBar
        title="建筑施工质检情报员"
        onMenuClick={() => setDrawerOpen(true)}
      />
      <MobileSideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <main className="flex-1 bg-zinc-50 p-4">{children}</main>
    </div>
  );
}
