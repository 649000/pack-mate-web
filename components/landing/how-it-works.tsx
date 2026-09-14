import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { CustomBadge } from "@/components/landing/custom/badge";
import { CustomTitle } from "@/components/landing/custom/title";
import { CustomSubtitle } from "@/components/landing/custom/subtitle";
import { Button } from "@/components/landing/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CheckCircle2, ListChecks, Luggage, Package } from "lucide-react";

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const manuallyTriggered = useRef(false);

  const steps = [
    {
      id: 1,
      title: "Build your library",
      description: "Save the items and bags you take again and again.",
      image: "/screens/2.png",
      icon: Package,
    },
    {
      id: 2,
      title: "Create a trip",
      description: "Start a trip and add the bags and items you need.",
      image: "/screens/3.png",
      icon: Luggage,
    },
    {
      id: 3,
      title: "Assign everything",
      description: "Put items in a bag, mark them With Me, or leave them loose.",
      image: "/screens/4.png",
      icon: ListChecks,
    },
    {
      id: 4,
      title: "Pack and tick off",
      description: "Work down the list and watch your progress fill up.",
      image: "/screens/5.png",
      icon: CheckCircle2,
    },
  ];

  const stepDuration = 5000; // 8 secon

  // Auto-advance steps with progress animation
  useEffect(() => {
    if (isPaused) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 100 / (stepDuration / 50);
      });
    }, 50);

    const stepTimeout = setTimeout(() => {
      setActiveStep((prevStep) => {
        const next = (prevStep + 1) % steps.length;
        manuallyTriggered.current = false; // reset the manual flag here
        return next;
      });
    }, stepDuration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimeout);
    };
  }, [activeStep, isPaused, steps.length]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    manuallyTriggered.current = true; // Flag as manual
    setTimeout(() => setIsPaused(false), 4000); // Resume auto
  };

  return (
    <section className="py-24 border-b border-border/50">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex items-center justify-center flex-col text-center gap-5 mb-16"
        >
          <CustomBadge>How it works</CustomBadge>

          <CustomTitle>From library to packed</CustomTitle>

          <CustomSubtitle>
            Four simple steps. No setup, no spreadsheets, and nothing forgotten at home.
          </CustomSubtitle>
        </motion.div>

        {/* Main Content Grid */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex flex-col gap-12 max-w-6xl mx-auto"
        >
          {/* Left Side - Step Navigation */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center cursor-pointer transition-all duration-300 overflow-hidden",
                )}
                onClick={() => handleStepClick(index)}
              >
                <div className="size-12 bg-indigo-100/40 dark:bg-indigo-950/60 rounded-full flex items-center justify-center">
                  <step.icon className="size-5 text-indigo-500" />
                </div>

                <h3
                  className={cn(
                    "p-5 pb-3 text-xl font-semibold mb-0 transition-colors duration-300",
                    index === activeStep ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.title}
                </h3>

                <div className="w-full h-0.5 bg-border/60">
                  <AnimatePresence>
                    {index === activeStep && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="h-0.5 w-full overflow-hidden"
                      >
                        {/* Progress Bar - moved to bottom */}
                        <motion.div
                          className="h-0.5 bg-gradient-to-r from-indigo-500 to-purple-400"
                          style={{ width: `${progress}%` }}
                          transition={{ duration: 0.05, ease: "linear" }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>

          {/* Right Side - Fading Images */}
          <div className="relative w-full rounded-xl overflow-hidden border border-border shadow-xs shadow-black/5 bg-background">
            <div className="max-h-[50vh] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeStep}
                  src={steps[activeStep].image}
                  alt={`${steps[activeStep].title} visualization`}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">Ready to pack? It takes less than a minute.</p>
          <Button size="lg" asChild>
            <Link href="/sign-in">Get started free</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
