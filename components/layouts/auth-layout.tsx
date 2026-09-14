import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function AuthLayout({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-6 inline-flex text-lg font-semibold tracking-tight">
            Pack Mate
          </Link>
          <Card className="w-full">{children}</Card>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Back to home
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden flex-1 overflow-hidden bg-zinc-950 lg:block">
        <Image
          src="/media/app/auth-bg.png"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 p-12">
          {aside ?? <p className="text-sm text-white/70">Pack once. Reuse on every trip.</p>}
        </div>
      </div>
    </div>
  );
}
