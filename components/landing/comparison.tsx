import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

import { CustomBadge } from "@/components/landing/custom/badge";
import { CustomSubtitle } from "@/components/landing/custom/subtitle";
import { CustomTitle } from "@/components/landing/custom/title";

const notesApp = [
  "One long note you rewrite every trip",
  "No idea which bag an item ended up in",
  "Packed state lives in your head",
  "Hard to hand the list to someone else",
];

const packMate = [
  "A packing list for every trip",
  "Items sorted into bags, With Me, or loose",
  "Tick items off and track your progress",
  "Share a read-only link in one tap",
];

const Comparison = () => {
  return (
    <section
      id="compare"
      className="scroll-mt-20 border-b border-border/60 bg-muted/40 py-20 sm:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <CustomBadge>Why Pack Mate</CustomBadge>
          <CustomTitle>Notes apps aren&apos;t luggage managers</CustomTitle>
          <CustomSubtitle>
            A list is easy to start and easy to lose track of. Pack Mate is built for the job of
            getting everything into the right bag.
          </CustomSubtitle>
        </motion.div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border bg-card p-6 sm:p-8"
          >
            <h3 className="font-heading text-lg font-semibold text-muted-foreground">
              A notes app or spreadsheet
            </h3>
            <ul className="mt-5 space-y-3">
              {notesApp.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <X className="size-3" aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="rounded-xl border border-primary/40 bg-primary/5 p-6 sm:p-8"
          >
            <h3 className="font-heading text-lg font-semibold text-foreground">Pack Mate</h3>
            <ul className="mt-5 space-y-3">
              {packMate.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-packed-soft text-packed-soft-foreground">
                    <Check className="size-3" aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Comparison;
