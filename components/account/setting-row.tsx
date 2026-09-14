"use client";

import type { ReactNode } from "react";
import { HexagonBadge } from "@/components/ui/hexagon-badge";

export function SettingRow({
  badge,
  title,
  description,
  action,
}: {
  badge: ReactNode;
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3.5 py-2.5">
      <div className="flex flex-wrap items-center gap-3.5">
        <HexagonBadge stroke="stroke-input" fill="fill-muted/30" size="size-[50px]" badge={badge} />
        <div className="flex flex-col gap-px">
          <span className="text-sm font-medium text-foreground">{title}</span>
          <span className="text-sm text-muted-foreground">{description}</span>
        </div>
      </div>
      {action && <div className="flex items-center gap-2 lg:gap-6">{action}</div>}
    </div>
  );
}
