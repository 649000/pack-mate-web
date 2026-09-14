import { motion } from "framer-motion";
import Marquee from "@/components/landing/ui/marquee";

const TrustedBrands = () => {
  const tripTypes = [
    "Weekend trips",
    "Business travel",
    "Family holidays",
    "Camping",
    "Backpacking",
    "City breaks",
    "Beach holidays",
    "Ski trips",
    "Road trips",
    "Festivals",
  ];

  return (
    <section className="pt-10 md:pt-15 pb-15 bg-background overflow-hidden border-b border-border/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs font-semibold text-muted-foreground tracking-wider mb-6 uppercase">
            Made for every kind of trip
          </p>
        </motion.div>

        {/* Marquee Container with fade shadows */}
        <div className="relative">
          {/* Left fade shadow */}
          <div className="absolute start-0 top-0 w-20 h-full bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />

          {/* Right fade shadow */}
          <div className="absolute end-0 top-0 w-20 h-full bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          {/* Marquee */}
          <Marquee pauseOnHover>
            {tripTypes.map((tripType, index) => (
              <span
                key={`${tripType}-${index}`}
                className="mx-8 whitespace-nowrap text-lg font-semibold text-muted-foreground/60 transition-colors duration-300 hover:text-muted-foreground flex-shrink-0"
              >
                {tripType}
              </span>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
};

export default TrustedBrands;
