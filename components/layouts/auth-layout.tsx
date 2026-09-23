import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function AuthLayout({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="flex flex-1 items-stretch">
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            <Link
              href="/"
              className="mx-auto mb-6 flex items-center justify-center gap-2 font-heading text-lg font-bold tracking-tight"
            >
              <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                PM
              </span>
              Pack Mate
            </Link>
            <Card className="w-full shadow-elevation-2">{children}</Card>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Back to home
              </Link>
            </p>
          </div>
        </div>

        <div className="relative hidden flex-1 items-center justify-center overflow-hidden border-l border-border bg-gradient-to-br from-primary/10 via-background to-packed/10 lg:flex">
          <div className="relative z-10 flex flex-col items-center justify-center gap-6 p-12">
            {aside ?? (
              <p className="text-sm text-muted-foreground">Pack once. Reuse on every trip.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
