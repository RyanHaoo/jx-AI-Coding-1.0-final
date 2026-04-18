"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type AnchorProps = ComponentProps<"a"> & { node?: unknown };

function isTicketPath(pathname: string): boolean {
  return /^\/(?:mobile|dashboard)\/tickets\/[^/]+/.test(pathname);
}

/** 将助手 Markdown 中的 href 解析为站内工单路径；否则返回 null */
function toTicketInternalPath(href: string): string | null {
  try {
    if (href.startsWith("/")) {
      const pathOnly = (href.split("#")[0] ?? "").trim();
      return isTicketPath(pathOnly.split("?")[0] ?? "") ? pathOnly : null;
    }
    const u = new URL(href);
    if (!isTicketPath(u.pathname)) return null;
    return u.pathname + u.search;
  } catch {
    return null;
  }
}

/**
 * 工单详情链接用 Next Link 在当前页跳转（避免 Streamdown / rehype-harden 的 target=_blank）。
 */
export function AgentMarkdownAnchor({
  href,
  children,
  className,
  node: _node,
  ...rest
}: AnchorProps) {
  const linkClassName = cn(
    "wrap-anywhere font-medium text-primary underline",
    className,
  );

  if (!href) {
    return (
      <a className={linkClassName} {...rest}>
        {children}
      </a>
    );
  }

  const internal = toTicketInternalPath(href);
  if (internal) {
    return (
      <Link className={linkClassName} href={internal}>
        {children}
      </Link>
    );
  }

  return (
    <a className={linkClassName} href={href} {...rest}>
      {children}
    </a>
  );
}
