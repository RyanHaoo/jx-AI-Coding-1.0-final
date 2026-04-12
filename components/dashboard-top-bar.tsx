"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IdentityDialog } from "@/components/identity-dialog";
import { UserAvatarChip } from "@/components/user-avatar-chip";
import type { IdentityOption } from "@/lib/types";

const breadcrumbMap: Record<string, string> = {
  "/dashboard/overview": "数据大盘",
  "/dashboard/tickets": "工单中心",
  "/dashboard/knowledge": "知识运营",
};

interface DashboardTopBarProps {
  userName: string;
  department: string;
  identities: IdentityOption[];
}

export function DashboardTopBar({
  userName,
  department,
  identities,
}: DashboardTopBarProps) {
  const pathname = usePathname();
  const currentPageName = breadcrumbMap[pathname] ?? "数据大盘";
  const [identityDialogOpen, setIdentityDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
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
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <UserAvatarChip name={userName} department={department} compact />
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setMenuOpen(false)}
                aria-label="关闭菜单"
              />
              <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-md border bg-white py-1 shadow-md">
                {identities.length > 1 && (
                  <button
                    type="button"
                    className="text-foreground w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setMenuOpen(false);
                      setIdentityDialogOpen(true);
                    }}
                  >
                    切换身份
                  </button>
                )}
                <form action="/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="text-muted-foreground w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    退出登录
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </header>

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
