"use client";

import Header from "@/components/landing/header";
import Hero from "@/components/landing/hero";
import TrustedBrands from "@/components/landing/trusted-brands";
import HowItWorks from "@/components/landing/how-it-works";
import Features from "@/components/landing/features";
import Testimonials from "@/components/landing/testimonails";
import Pricing from "@/components/landing/pricing";
import FAQ from "@/components/landing/faq";
import CallToAction from "@/components/landing/call-to-action";
import Contact from "@/components/landing/contact";
import Footer from "@/components/landing/footer";

export default function Page() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <TrustedBrands />
      <HowItWorks />
      <Features />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CallToAction />
      <Contact />
      <Footer />
    </div>
  );
}
