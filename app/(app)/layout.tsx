import type { ReactNode } from "react";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/layouts/app-shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
