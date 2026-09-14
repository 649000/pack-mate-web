import { motion } from "framer-motion";
import Marquee from "@/components/landing/ui/marquee";
import { CustomBadge } from "@/components/landing/custom/badge";
import { CustomTitle } from "@/components/landing/custom/title";
import { CustomSubtitle } from "@/components/landing/custom/subtitle";
import Image from "next/image";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Frequent flyer",
      content: "I stopped rewriting the same list every trip. Pack Mate just works.",
      avatar:
        "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=100&h=100&fit=crop&crop=face",
    },
    {
      name: "Marcus Johnson",
      role: "Weekend camper",
      content: "My backpack has its usual contents ready to go in one tap.",
      avatar:
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop&crop=face",
    },
    {
      name: "Emily Rodriguez",
      role: "Parent of three",
      content: "Packing for a family used to be chaos. Now everyone knows what is in which bag.",
      avatar:
        "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=100&h=100&fit=crop&crop=face",
    },
    {
      name: "David Kim",
      role: "Business traveller",
      content: "Passport, wallet, phone marked With Me. I never leave one behind now.",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    },
    {
      name: "Lisa Thompson",
      role: "Backpacker",
      content: "The packed progress bar makes a long list feel manageable.",
      avatar:
        "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop&crop=face",
    },
    {
      name: "Alex Martinez",
      role: "Weekend traveller",
      content: "Reusable bags mean I pack in minutes, not an hour.",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    },
    {
      name: "Jennifer Park",
      role: "Hiker",
      content: "Simple, fast, and it works on my phone while I am standing in the hall.",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    },
    {
      name: "Michael Brown",
      role: "Road tripper",
      content: "I know exactly which bag every item is in before I load the car.",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    },
    {
      name: "Rachel Green",
      role: "City break regular",
      content: "No setup, no clutter. I made a list and started packing.",
      avatar:
        "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop&crop=face",
    },
    {
      name: "John Doe",
      role: "Ski instructor",
      content: "My gear bag keeps the same contents for every season.",
      avatar:
        "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop&crop=face",
    },
  ];

  const TestimonialCard = ({ testimonial }: { testimonial: (typeof testimonials)[0] }) => (
    <div className="flex-shrink-0 w-[350px] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/15 dark:to-indigo-900/15 rounded-xl p-6 border border-border/50 shadow-sm mx-1.5">
      <p className="text-muted-foreground mb-4 font-medium">{testimonial.content}</p>
      <div className="flex items-center gap-3">
        <Image
          src={testimonial.avatar}
          alt={testimonial.name}
          width={40}
          height={40}
          className="rounded-full object-cover"
        />
        <div>
          <div className="font-semibold text-foreground">{testimonial.name}</div>
          <div className="text-sm text-muted-foreground">{testimonial.role}</div>
        </div>
      </div>
    </div>
  );

  const firstColumn = testimonials.slice(0, 5);
  const secondColumn = testimonials.slice(5, 10);

  return (
    <section className="py-24 bg-background overflow-hidden border-b border-border/50">
      <div className="container mx-auto px-6 lg:px-12 mb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex items-center justify-center flex-col text-center gap-5 mb-16"
        >
          <CustomBadge>Testimonials</CustomBadge>

          <CustomTitle>Loved by Thousands</CustomTitle>

          <CustomSubtitle>
            Discover why travellers love Pack Mate and start packing smarter on your next trip.
          </CustomSubtitle>
        </motion.div>
      </div>

      <div className="w-full mx-auto px-6">
        <motion.div
          className="relative flex w-full flex-col items-center justify-center overflow-hidden gap-1.5 mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Marquee pauseOnHover className="[--duration:40s] grow">
            {firstColumn.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </Marquee>
          <Marquee reverse pauseOnHover className="[--duration:40s] grow">
            {secondColumn.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </Marquee>
          <div className="pointer-events-none absolute inset-y-0 start-0 w-1/12 bg-gradient-to-r from-background"></div>
          <div className="pointer-events-none absolute inset-y-0 end-0 w-1/12 bg-gradient-to-l from-background"></div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
