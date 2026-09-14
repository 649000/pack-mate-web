import { motion } from "framer-motion";
import { Globe, X, Send, Mail } from "lucide-react";
import { Separator } from "@/components/landing/ui/separator";
import Logo from "@/components/landing/logo";

const Footer = () => {
  const links = {
    product: ["Features", "Pricing", "FAQ", "Sign in"],
    company: ["Trips", "Bags", "Items", "Contact"],
    support: ["Getting started", "Privacy", "Terms", "Security"],
  };

  const socialLinks = [
    { icon: X, href: "#", label: "X (Twitter)" },
    { icon: Globe, href: "#", label: "Website" },
    { icon: Send, href: "#", label: "Newsletter" },
    { icon: Mail, href: "#", label: "Email" },
  ];

  return (
    <footer className="bg-background relative overflow-hidden">
      <div className="container px-6 mx-auto pt-14 pb-6 border-b border-border/50">
        <div className="flex flex-col lg:flex-row justify-between items-start">
          {/* Logo and description - Left side */}
          <div className="lg:w-1/3 mb-12 lg:mb-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center mb-3">
                <Logo />
              </div>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Build reusable bags and items once, then pack them into a list for any trip.
              </p>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="size-9 border border-border/60 text-muted-foreground rounded-md flex items-center justify-center hover:text-foreground transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="size-4" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* 3 Column Menu - Right aligned */}
          <div className="w-full grow lg:w-auto lg:grow-0 lg:w-2/3 flex justify-end">
            <div className="w-full lg:w-auto flex justify-between flex-wrap lg:grid lg:grid-cols-3 gap-8 lg:gap-16">
              {Object.entries(links).map(([category, items], categoryIndex) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                  viewport={{ once: true }}
                >
                  <h3 className="font-medium text-base mb-4 capitalize text-muted-foreground/80">
                    {category}
                  </h3>
                  <ul className="text-base space-y-2">
                    {items.map((item, index) => (
                      <li key={index}>
                        <a
                          href="#"
                          className="text-accent-foreground hover:text-indigo-600 transition-colors hover:underline"
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <Separator className="my-6 bg-border/50" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">© 2026 Pack Mate. All rights reserved.</p>
          <p className="text-muted-foreground text-sm mt-4 md:mt-0">
            Simple packing lists for every trip.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
