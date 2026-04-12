"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IdentityDialog } from "@/components/identity-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { IdentityOption } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MobileSideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  department: string;
  projectName: string;
  role: string;
  identities: IdentityOption[];
}

const menuItems = [
  { label: "智能助手", href: "/mobile/assistant" },
  { label: "工单列表", href: "/mobile/tickets" },
];

export function MobileSideDrawer({
  open,
  onOpenChange,
  userName,
  department,
  projectName,
  role,
  identities,
}: MobileSideDrawerProps) {
  const pathname = usePathname();
  const [identityDialogOpen, setIdentityDialogOpen] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="text-base">建筑施工质检情报员</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col py-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "px-4 py-2.5 text-sm transition-colors hover:bg-muted",
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User section at bottom */}
          <div className="border-t px-4 pt-4 pb-3">
            <div className="mb-3">
              <p className="text-foreground text-sm font-medium">{userName}</p>
              <p className="text-muted-foreground text-xs">
                {department} · {projectName} · {role}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {identities.length > 1 && (
                <button
                  type="button"
                  className="text-primary text-sm hover:underline"
                  onClick={() => setIdentityDialogOpen(true)}
                >
                  切换身份
                </button>
              )}
              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-muted-foreground text-sm hover:underline"
                >
                  退出登录
                </button>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {identities.length > 1 && (
        <IdentityDialog
          open={identityDialogOpen}
          onOpenChange={setIdentityDialogOpen}
          identities={identities}
          mode="switch"
        />
      )}
    </>
  );
}
