"use client";

import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileTopBarProps {
  title: string;
  onMenuClick: () => void;
  showBack?: boolean;
  onBack?: () => void;
}

export function MobileTopBar({
  title,
  onMenuClick,
  showBack = false,
  onBack,
}: MobileTopBarProps) {
  return (
    <header className="flex h-12 items-center bg-[var(--stitch-surface-container-lowest)] px-4">
      {showBack ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          aria-label="返回"
        >
          <ArrowLeft />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onMenuClick}
          aria-label="打开菜单"
        >
          <Menu />
        </Button>
      )}
      <h1 className="ml-2 text-base font-medium text-foreground">{title}</h1>
    </header>
  );
}
