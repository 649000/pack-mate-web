import Link from "next/link";
import { Compass, Home, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Compass className="size-7" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Status 404
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Destination not on the itinerary
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The packing list, bag template, or link you are looking for has been moved, unpacked, or
          never checked in.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/dashboard">
            <Home aria-hidden="true" />
            Return to dashboard
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/trips">
            <ListChecks aria-hidden="true" />
            View all trips
          </Link>
        </Button>
      </div>
    </div>
  );
}
