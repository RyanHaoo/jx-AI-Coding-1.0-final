"use client";

import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ClipboardList,
  Construction,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "数据概览", href: "/dashboard/overview", icon: LayoutDashboard },
  { label: "工单中心", href: "/dashboard/tickets", icon: ClipboardList },
  { label: "知识运营", href: "/dashboard/knowledge", icon: BookOpen },
];

export function DashboardSideNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-64 flex-col bg-[var(--stitch-surface-container-low)]">
      {/* Brand area */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[var(--stitch-outline-variant)]/20">
        <Construction className="size-6 text-[var(--stitch-primary)]" />
        <span className="text-sm font-semibold text-foreground">
          施工质检情报员
        </span>
      </div>

      {/* Navigation items */}
      <div className="flex flex-col gap-1 px-3 py-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
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
      </div>
    </nav>
  );
}
