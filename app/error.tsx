"use client";

import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-warning-soft text-warning-soft-foreground">
        <AlertTriangle className="size-7" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Status 500
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Unexpected turbulence</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Something went wrong while loading this page. Your trips and packing lists are safe.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>
          <RotateCcw aria-hidden="true" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <Home aria-hidden="true" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
