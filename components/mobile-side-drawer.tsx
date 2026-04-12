"use client";

import type { LucideIcon } from "lucide-react";
import { ClipboardList, MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IdentityDialog } from "@/components/identity-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { IdentityOption } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface MobileSideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  userName: string;
  department: string;
  projectName: string;
  role: string;
  identities: IdentityOption[];
}

const menuItems: NavItem[] = [
  { label: "智能助手", href: "/mobile/assistant", icon: MessageSquare },
  { label: "工单列表", href: "/mobile/tickets", icon: ClipboardList },
];

export function MobileSideDrawer({
  open,
  onOpenChange,
  title,
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
        <SheetContent
          side="left"
          className="w-64 p-0 bg-[var(--stitch-surface-container-low)]"
          showCloseButton={false}
        >
          {/* Header */}
          <SheetHeader className="border-b border-[var(--stitch-outline-variant)]/20 px-5 py-5">
            <SheetTitle className="text-base text-foreground">
              {title}
            </SheetTitle>
            <SheetDescription className="text-xs text-[var(--stitch-on-surface-variant)]">
              建筑施工质检情报员
            </SheetDescription>
          </SheetHeader>

          {/* Navigation */}
          <nav className="flex flex-col gap-1 px-3 py-3">
            {menuItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-[var(--stitch-primary-container)] text-[var(--stitch-on-primary-container)] font-medium"
                      : "text-[var(--stitch-on-surface-variant)] hover:bg-[var(--stitch-surface-container-high)]",
                  )}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User info at bottom */}
          <div className="absolute inset-x-0 bottom-0 border-t border-[var(--stitch-outline-variant)]/20 px-5 py-4">
            <div className="mb-3">
              <p className="text-foreground text-sm font-medium">{userName}</p>
              <p className="text-[var(--stitch-on-surface-variant)] text-xs">
                {department} · {projectName} · {role}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {identities.length > 1 && (
                <button
                  type="button"
                  className="text-[var(--stitch-primary)] text-sm hover:underline"
                  onClick={() => setIdentityDialogOpen(true)}
                >
                  切换身份
                </button>
              )}
              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-[var(--stitch-on-surface-variant)] text-sm hover:underline"
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
