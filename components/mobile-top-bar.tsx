"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileTopBarProps {
  title: string;
  onMenuClick: () => void;
}

export function MobileTopBar({ title, onMenuClick }: MobileTopBarProps) {
  return (
    <header className="flex h-12 items-center bg-[var(--stitch-surface-container-lowest)] px-4">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onMenuClick}
        aria-label="打开菜单"
      >
        <Menu />
      </Button>
      <h1 className="ml-2 text-base font-medium text-foreground">{title}</h1>
    </header>
  );
}
