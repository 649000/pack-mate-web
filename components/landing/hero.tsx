import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/landing/ui/button";
import { BrowserFrame, TripPreview } from "@/components/landing/app-preview";

const Hero = () => {
  return (
    <section className="relative scroll-mt-20 overflow-hidden border-b border-border/60 bg-background pt-28 pb-16 lg:pt-36 lg:pb-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent"
      />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Packing lists, without the chaos
            </span>

            <h1 className="mt-5 font-heading text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
              Pack lighter. Travel prepared.{" "}
              <span className="text-primary">Never forget the essentials.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
              Build reusable bags and items once, then pack a list for any trip. You always know
              what you are bringing, and exactly where it goes.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/sign-in">
                  Get started for free
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Free to use. No credit card, no setup required.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="min-w-0"
            aria-hidden="true"
          >
            <BrowserFrame>
              <TripPreview />
            </BrowserFrame>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
