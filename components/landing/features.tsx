import { motion } from "framer-motion";
import { FileText, ListChecks, Luggage, RefreshCw, Share2, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CustomBadge } from "@/components/landing/custom/badge";
import { CustomSubtitle } from "@/components/landing/custom/subtitle";
import { CustomTitle } from "@/components/landing/custom/title";
import { cn } from "@/lib/utils";

type Tone = "primary" | "packed" | "withMe" | "warning" | "pending";

const toneStyles: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  packed: "bg-packed-soft text-packed-soft-foreground",
  withMe: "bg-with-me-soft text-with-me-soft-foreground",
  warning: "bg-warning-soft text-warning-soft-foreground",
  pending: "bg-pending-soft text-pending-soft-foreground",
};

const features: { icon: LucideIcon; title: string; description: string; tone: Tone }[] = [
  {
    icon: RefreshCw,
    title: "Reusable library",
    description:
      "Save the items and bags you take on every trip. Add them once, then reuse them whenever you pack again.",
    tone: "primary",
  },
  {
    icon: Luggage,
    title: "Bags with default contents",
    description:
      "Give each bag its usual contents. Add it to a trip and it arrives already filled, ready to pack.",
    tone: "packed",
  },
  {
    icon: Wallet,
    title: "With Me",
    description:
      "Mark what you carry yourself, like your passport, wallet or phone, kept separate from what goes inside a bag.",
    tone: "withMe",
  },
  {
    icon: ListChecks,
    title: "Packed progress",
    description:
      "Tick items off as they go in and see exactly how much is left, so nothing gets forgotten.",
    tone: "warning",
  },
  {
    icon: Share2,
    title: "Share a list",
    description:
      "Send a read-only link so the people you travel with can see the plan without changing it.",
    tone: "pending",
  },
  {
    icon: FileText,
    title: "PDF export",
    description:
      "Download any packing list as a PDF, ready to print or check on the way to the airport.",
    tone: "primary",
  },
];

const Features = () => {
  return (
    <section
      id="features"
      className="scroll-mt-20 border-b border-border/60 bg-background py-20 sm:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <CustomBadge>Features</CustomBadge>
          <CustomTitle>Six features designed for real trips</CustomTitle>
          <CustomSubtitle>
            Everything you need to pack well, and nothing you have to configure first. Simple by
            default, fast to use.
          </CustomSubtitle>
        </motion.div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
              viewport={{ once: true }}
              className="h-full"
            >
              <div className="h-full rounded-xl border border-border bg-card p-6 shadow-elevation-1 transition-colors hover:border-primary/40">
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-lg",
                    toneStyles[feature.tone],
                  )}
                >
                  <feature.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-heading text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-pretty text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
