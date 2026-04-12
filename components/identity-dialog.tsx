"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { switchIdentity } from "@/lib/auth-actions";
import type { IdentityOption } from "@/lib/types";

interface IdentityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  identities: IdentityOption[];
  mode: "login" | "switch";
  onSelect?: (identity: IdentityOption) => void;
}

export function IdentityDialog({
  open,
  onOpenChange,
  identities,
  mode,
  onSelect,
}: IdentityDialogProps) {
  const router = useRouter();

  async function handleSelect(identity: IdentityOption) {
    if (mode === "switch") {
      await switchIdentity(
        identity.projectId,
        identity.projectName,
        identity.role,
      );
      onOpenChange(false);
      router.refresh();
    } else {
      onSelect?.(identity);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>选择身份</DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "您有多个项目角色，请选择要进入的身份"
              : "请选择要切换的身份"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {identities.map((identity) => (
            <button
              key={`${identity.projectId}-${identity.role}`}
              type="button"
              className="hover:bg-accent flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors"
              onClick={() => handleSelect(identity)}
            >
              <span className="text-foreground font-medium">
                {identity.projectName}
              </span>
              <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-sm">
                {identity.role}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
