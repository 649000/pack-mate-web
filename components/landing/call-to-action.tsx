import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/landing/ui/button";

const CallToAction = () => {
  return (
    <section
      id="get-started"
      className="scroll-mt-20 bg-background px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-2xl bg-primary px-6 py-14 text-center sm:px-12 sm:py-20"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,var(--color-primary-foreground)_1px,transparent_0)] [background-size:24px_24px]"
        />

        <div className="relative">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-balance text-primary-foreground sm:text-4xl">
            Ready to master your luggage?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-pretty text-primary-foreground/80 sm:text-lg">
            Start a free packing list, reuse your gear on every trip, and know exactly where
            everything is.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              asChild
              size="lg"
              className="w-full bg-background text-foreground hover:bg-background/90 sm:w-auto"
            >
              <Link href="/sign-in">
                Get started for free
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default CallToAction;
