import type { ReactNode } from "react";
import { TopNav } from "./top-nav";
import { MobileNav } from "./mobile-nav";
import { Footer } from "./footer";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav />
      <MobileNav />
      <main className="grow py-8 pb-28 lg:py-10" role="content">
        <div className="container">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
