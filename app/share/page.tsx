import { Suspense } from "react";
import type { Metadata } from "next";
import { SharedTripPage } from "@/components/share/shared-trip-page";

export const metadata: Metadata = {
  title: "Shared packing list · Pack Mate",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <p className="py-10 text-center text-sm text-muted-foreground">Loading shared list...</p>
      }
    >
      <SharedTripPage />
    </Suspense>
  );
}
