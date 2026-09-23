import { motion } from "framer-motion";
import { BookOpen, CheckCheck, Luggage } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CustomBadge } from "@/components/landing/custom/badge";
import { CustomSubtitle } from "@/components/landing/custom/subtitle";
import { CustomTitle } from "@/components/landing/custom/title";

const steps: { number: string; icon: LucideIcon; title: string; description: string }[] = [
  {
    number: "01",
    icon: BookOpen,
    title: "Build your library",
    description: "Save the items and bags you take again and again.",
  },
  {
    number: "02",
    icon: Luggage,
    title: "Plan a trip",
    description: "Start a trip and copy in the bags and items you need.",
  },
  {
    number: "03",
    icon: CheckCheck,
    title: "Pack and go",
    description: "Work down the list, tick things off and watch progress climb.",
  },
];

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
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
          <CustomBadge>How it works</CustomBadge>
          <CustomTitle>Peace of mind from departure gate to hostel</CustomTitle>
          <CustomSubtitle>
            Three steps from an empty list to a bag that is actually packed.
          </CustomSubtitle>
        </motion.div>

        <ol className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.li
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative min-w-0"
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm font-semibold tabular-nums text-primary">
                  {step.number}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <span className="mt-6 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <step.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-heading text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-pretty text-muted-foreground">{step.description}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default HowItWorks;
