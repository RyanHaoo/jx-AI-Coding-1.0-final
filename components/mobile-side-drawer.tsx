"use client";

import type { LucideIcon } from "lucide-react";
import { ClipboardList, MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
}

const menuItems: NavItem[] = [
  { label: "智能助手", href: "/mobile/assistant", icon: MessageSquare },
  { label: "工单列表", href: "/mobile/tickets", icon: ClipboardList },
];

export function MobileSideDrawer({
  open,
  onOpenChange,
  title,
}: MobileSideDrawerProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-64 p-0 bg-[var(--stitch-surface-container-low)]"
        showCloseButton={false}
      >
        {/* Header */}
        <SheetHeader className="border-b border-[var(--stitch-outline-variant)]/20 px-5 py-5">
          <SheetTitle className="text-base text-foreground">{title}</SheetTitle>
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
          <div className="flex items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-[var(--stitch-primary-container)] text-xs font-medium text-[var(--stitch-on-primary-container)]">
              U
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">用户</span>
              <span className="text-xs text-[var(--stitch-on-surface-variant)]">
                角色
              </span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
