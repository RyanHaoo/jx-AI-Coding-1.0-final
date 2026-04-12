"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "数据大盘", href: "/dashboard/overview" },
  { label: "工单中心", href: "/dashboard/tickets" },
  { label: "知识运营", href: "/dashboard/knowledge" },
];

export function DashboardSideNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-52 flex-col border-r bg-white py-4">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "px-5 py-2.5 text-sm transition-colors hover:bg-muted",
            pathname === item.href
              ? "bg-muted font-medium text-foreground"
              : "text-muted-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
