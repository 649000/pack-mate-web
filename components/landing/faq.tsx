import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/landing/ui/accordion";
import { CustomBadge } from "@/components/landing/custom/badge";
import { CustomTitle } from "@/components/landing/custom/title";
import { CustomSubtitle } from "@/components/landing/custom/subtitle";

import Link from "next/link";

const FAQ = () => {
  const faqs = [
    {
      question: "Is Pack Mate free?",
      answer:
        "Yes. You can create trips and pack them without paying. Paid plans add extra convenience, but the core app is free to use.",
    },
    {
      question: "Do I have to create bags?",
      answer:
        "No. Items can sit directly on your packing list or be marked With Me. Bags are optional, so you can start packing straight away.",
    },
    {
      question: "What does With Me mean?",
      answer:
        "With Me is for things you carry yourself, like your passport, wallet or phone, rather than packing them inside a bag.",
    },
    {
      question: "Can an item be in a bag and With Me at the same time?",
      answer:
        "No. An item is either inside a bag or With Me, never both, so your list always has a single clear answer for where something is.",
    },
    {
      question: "Will editing my library change past trips?",
      answer:
        "No. Adding an item or bag to a trip copies it. Later edits to your library leave existing packing lists untouched.",
    },
    {
      question: "Does Pack Mate work on my phone?",
      answer:
        "Yes. Pack Mate is designed mobile-first, so it works well while you are standing in the hallway packing your bag.",
    },
    {
      question: "Can I reorder my list?",
      answer:
        "Yes. Drag bags and items into the order that matches how you pack, so the list follows your routine.",
    },
    {
      question: "Do I need an account?",
      answer:
        "Yes. A free account keeps your trips, bags and items private to you, and lets you come back to them on any device.",
    },
  ];

  return (
    <section className="py-24 bg-background" id="faq">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex items-center justify-center flex-col text-center gap-5 mb-25"
        >
          <CustomBadge>FAQ</CustomBadge>

          <CustomTitle>Frequently Asked Questions</CustomTitle>

          <CustomSubtitle>
            Got questions? Here are the most common things people ask about Pack Mate.
          </CustomSubtitle>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="bg-background rounded-lg border! border-border px-6 hover:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="text-start font-semibold text-foreground hover:text-indigo-600 data-[state=open]:text-indigo-600 transition-colors cursor-pointer">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="flex flex-col justify-center items-center gap-1.5 text-center mt-12"
        >
          <span className="text-muted-foreground">Still have questions?</span>

          <Link
            href="#contact"
            className="text-indigo-600 hover:text-indigo-700 transition-colors hover:underline"
          >
            Contact our Support Team
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
