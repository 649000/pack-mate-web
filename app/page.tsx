"use client";

import Header from "@/components/landing/header";
import Hero from "@/components/landing/hero";
import Stats from "@/components/landing/stats";
import ProductShowcase from "@/components/landing/product-showcase";
import Features from "@/components/landing/features";
import Comparison from "@/components/landing/comparison";
import HowItWorks from "@/components/landing/how-it-works";
import CallToAction from "@/components/landing/call-to-action";
import Footer from "@/components/landing/footer";

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Stats />
        <ProductShowcase />
        <Features />
        <Comparison />
        <HowItWorks />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
