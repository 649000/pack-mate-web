import { motion } from "framer-motion";

import { CustomBadge } from "@/components/landing/custom/badge";
import { CustomSubtitle } from "@/components/landing/custom/subtitle";
import { CustomTitle } from "@/components/landing/custom/title";
import { BrowserFrame, ChecklistPreview, TripPreview } from "@/components/landing/app-preview";

const panels = [
  {
    eyebrow: "Trips & bags",
    title: "See the whole trip at a glance",
    description:
      "Group items into the bags you actually carry, mark what stays With Me, or leave things loose until you decide.",
    preview: <TripPreview />,
  },
  {
    eyebrow: "Packing list",
    title: "Pack from a clear checklist",
    description:
      "Tick items off as they go in and watch progress fill up, so the list is done before you walk out the door.",
    preview: <ChecklistPreview />,
  },
];

const ProductShowcase = () => {
  return (
    <section
      id="product"
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
          <CustomBadge>The product</CustomBadge>
          <CustomTitle>Purpose-built for how you actually travel</CustomTitle>
          <CustomSubtitle>
            A trip, a packing list, and the bags you own. Nothing more to configure before you start
            packing.
          </CustomSubtitle>
        </motion.div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {panels.map((panel, index) => (
            <motion.div
              key={panel.eyebrow}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="min-w-0"
            >
              <div className="mb-6">
                <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                  {panel.eyebrow}
                </p>
                <h3 className="mt-2 font-heading text-xl font-semibold text-foreground">
                  {panel.title}
                </h3>
                <p className="mt-2 text-sm text-pretty text-muted-foreground">
                  {panel.description}
                </p>
              </div>
              <div aria-hidden="true">
                <BrowserFrame>{panel.preview}</BrowserFrame>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
