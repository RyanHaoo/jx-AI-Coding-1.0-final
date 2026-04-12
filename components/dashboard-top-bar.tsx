"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const breadcrumbMap: Record<string, string> = {
  "/dashboard/overview": "数据大盘",
  "/dashboard/tickets": "工单中心",
  "/dashboard/knowledge": "知识运营",
};

export function DashboardTopBar() {
  const pathname = usePathname();
  const currentPageName = breadcrumbMap[pathname] ?? "数据大盘";

  return (
    <header className="flex h-16 items-center justify-between bg-[var(--stitch-surface-container-lowest)] px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm">
        <Link
          href="/dashboard/overview"
          className="text-[var(--stitch-on-surface-variant)] hover:text-foreground transition-colors"
        >
          首页
        </Link>
        <ChevronRight className="size-4 text-[var(--stitch-on-surface-variant)]" />
        <span className="font-medium text-foreground">{currentPageName}</span>
      </div>

      {/* User info */}
      <div className="flex items-center gap-2 text-sm text-[var(--stitch-on-surface-variant)]">
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-[var(--stitch-primary-container)] text-xs font-medium text-[var(--stitch-on-primary-container)]">
          U
        </span>
        <span>用户</span>
      </div>
    </header>
  );
}
