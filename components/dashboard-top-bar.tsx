"use client";

import { useState } from "react";
import { IdentityDialog } from "@/components/identity-dialog";
import { UserAvatarChip } from "@/components/user-avatar-chip";
import type { IdentityOption } from "@/lib/types";

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
  const [identityDialogOpen, setIdentityDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="flex h-12 items-center justify-between border-b bg-white px-6">
        <h1 className="text-base font-medium">建筑施工质检情报员</h1>
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
