"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendPasswordReset } from "@/lib/account";
import { validateEmail } from "@/lib/validation";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const address = validateEmail(email);
      await sendPasswordReset(address);
      setSent(true);
      toast.success(`Password reset link sent to ${address}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <CardContent className="space-y-5 p-6">
        <div className="space-y-1 pb-3 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a password reset link.
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email address"
              required
              disabled={sent || submitting}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting || sent}>
            {submitting ? "Sending..." : sent ? "Link sent" : "Send reset link"}
          </Button>
          <Button type="button" variant="outline" className="w-full" asChild>
            <Link href="/sign-in">
              <ArrowLeft className="size-3.5" /> Back to sign in
            </Link>
          </Button>
        </form>
      </CardContent>
    </AuthLayout>
  );
}
