import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/landing/ui/card";
import { Button } from "@/components/landing/ui/button";
import { Input } from "@/components/landing/ui/input";
import { Textarea } from "@/components/landing/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/landing/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Clock, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { CustomBadge } from "@/components/landing/custom/badge";
import { CustomSubtitle } from "@/components/landing/custom/subtitle";
import { CustomTitle } from "@/components/landing/custom/title";
import Link from "next/link";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async () => {
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast("Message sent!. Thank you for your message. We'll get back to you soon.");

    form.reset();
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      content: "hello@packmate.app",
    },
    {
      icon: MessageCircle,
      title: "Support",
      content: "support@packmate.app",
    },
    {
      icon: Clock,
      title: "Response time",
      content: "Within 1 business day",
    },
  ];

  return (
    <section id="contact" className="py-24 bg-zinc-50 dark:bg-zinc-950 border-b border-border/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex items-center justify-center flex-col text-center gap-5 mb-25"
        >
          <CustomBadge>Get in Touch</CustomBadge>

          <CustomTitle>Contact Us</CustomTitle>

          <CustomSubtitle>
            Have questions or ready to get started with Pack Mate? Send us a message and we&apos;ll
            respond as soon as possible.
          </CustomSubtitle>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                Let&apos;s Start a Conversation
              </h3>
              <p className="text-muted-foreground mb-8">
                Whether you&apos;re planning your first trip or packing for a family, we&apos;re
                here to help you get the most out of Pack Mate.
              </p>
            </div>

            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4"
                >
                  <info.icon className="size-4 text-muted-foreground mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{info.title}</h4>
                    {info.icon === Mail ? (
                      <Link
                        href={`mailto:${info.content}`}
                        className="text-muted-foreground hover:text-purple-500 whitespace-pre-line"
                      >
                        {info.content}
                      </Link>
                    ) : (
                      <p className="text-muted-foreground whitespace-pre-line">{info.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="border-border/50">
              <CardContent className="p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="your@email.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="What's this about?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us more about your project or question..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button size="lg" type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
