import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pack Mate",
  description: "Simple packing lists for your trips.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col text-base text-foreground bg-background">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
