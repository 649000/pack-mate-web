import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { SharedTripPage } from "@/components/share/shared-trip-page";

export const metadata: Metadata = {
  title: "Shared packing list · Pack Mate",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function SharePage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
      <SharedTripPage />
    </Suspense>
  );
}
