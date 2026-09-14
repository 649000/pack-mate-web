"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { toast } from "sonner";
import type { AuthCredential, MultiFactorResolver } from "firebase/auth";
import { useAuth } from "@/components/auth-provider";
import { AuthLayout } from "@/components/layouts/auth-layout";
import {
  MfaRequiredError,
  accountEmailFrom,
  isAccountExistsError,
  linkPendingCredential,
  pendingCredentialFrom,
} from "@/lib/account";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

function PreviewRow({ label, qty, packed }: { label: string; qty?: string; packed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={
          packed
            ? "flex size-4 shrink-0 items-center justify-center rounded-[4px] bg-primary text-primary-foreground"
            : "size-4 shrink-0 rounded-[4px] border border-input"
        }
      >
        {packed && <Check className="size-3" />}
      </span>
      <span className={packed ? "text-sm text-muted-foreground" : "text-sm"}>{label}</span>
      {qty && <span className="ms-auto text-xs text-muted-foreground">{qty}</span>}
    </div>
  );
}

function PreviewGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function PackingPreview() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-background p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-base font-semibold">Japan</p>
          <p className="text-xs text-muted-foreground">7 of 9 packed</p>
        </div>
        <Progress value={78} className="h-2 w-24" />
      </div>

      <div className="space-y-5">
        <PreviewGroup title="Main backpack">
          <PreviewRow label="T-shirts" qty="x4" packed />
          <PreviewRow label="Socks" qty="x5" packed />
          <PreviewRow label="Toiletry bag" packed />
          <PreviewRow label="Charger" />
        </PreviewGroup>
        <PreviewGroup title="Daypack">
          <PreviewRow label="Water bottle" packed />
          <PreviewRow label="Snacks" />
        </PreviewGroup>
        <PreviewGroup title="With Me">
          <PreviewRow label="Passport" packed />
          <PreviewRow label="Wallet" packed />
          <PreviewRow label="Phone" packed />
        </PreviewGroup>
      </div>
    </div>
  );
}

export default function SignInPage() {
  const { user, loading, signIn, signUp, signInWithGoogle, resolveMfa } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [linkCredential, setLinkCredential] = useState<AuthCredential | null>(null);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkPassword, setLinkPassword] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/trips");
    }
  }, [loading, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "sign-in") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      router.replace("/trips");
    } catch (error) {
      if (error instanceof MfaRequiredError) {
        setMfaResolver(error.resolver);
        setMfaCode("");
      } else {
        toast.error(error instanceof Error ? error.message : "Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMfaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mfaResolver) return;
    setSubmitting(true);
    try {
      await resolveMfa(mfaResolver, mfaCode.trim());
      if (linkCredential) {
        await linkPendingCredential(linkCredential);
      }
      router.replace("/trips");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid code");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setSubmitting(true);
    try {
      await signInWithGoogle();
      router.replace("/trips");
    } catch (error) {
      if (isAccountExistsError(error)) {
        const credential = pendingCredentialFrom(error);
        if (credential) {
          setLinkCredential(credential);
          setLinkEmail(accountEmailFrom(error) ?? email);
          setLinkPassword("");
          return;
        }
      }
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function cancelLink() {
    setLinkCredential(null);
    setLinkEmail("");
    setLinkPassword("");
  }

  async function handleLinkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!linkCredential) return;
    setSubmitting(true);
    try {
      await signIn(linkEmail, linkPassword);
      await linkPendingCredential(linkCredential);
      router.replace("/trips");
    } catch (error) {
      if (error instanceof MfaRequiredError) {
        setMfaResolver(error.resolver);
        setMfaCode("");
      } else {
        toast.error(error instanceof Error ? error.message : "Could not link Google");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      aside={
        <>
          <PackingPreview />
          <p className="text-sm text-white/70">Pack once. Reuse on every trip.</p>
        </>
      }
    >
      <CardHeader>
        <CardTitle>
          {mfaResolver
            ? "Two-factor authentication"
            : linkCredential
              ? "Link Google"
              : mode === "sign-in"
                ? "Sign in"
                : "Create account"}
        </CardTitle>
        <CardDescription>
          {mfaResolver
            ? "Enter the code from your authenticator app."
            : linkCredential
              ? "An account with this email already exists. Sign in with your password to link Google."
              : mode === "sign-in"
                ? "Welcome back to Pack Mate."
                : "Start building your packing lists."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mfaResolver ? (
          <form className="flex flex-col gap-4" onSubmit={handleMfaSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mfa-code">Authentication code</Label>
              <Input
                id="mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={mfaCode}
                onChange={(event) => setMfaCode(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Verifying..." : "Verify"}
            </Button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setMfaResolver(null)}
            >
              Back to sign in
            </button>
          </form>
        ) : linkCredential ? (
          <form className="flex flex-col gap-4" onSubmit={handleLinkSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="link-email">Email</Label>
              <Input id="link-email" type="email" value={linkEmail} readOnly disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="link-password">Password</Label>
              <Input
                id="link-password"
                type="password"
                autoComplete="current-password"
                required
                value={linkPassword}
                onChange={(event) => setLinkPassword(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Linking..." : "Sign in and link Google"}
            </Button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={cancelLink}
            >
              Cancel
            </button>
          </form>
        ) : (
          <>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "sign-in" && (
                    <Link
                      href="/reset-password"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                {mode === "sign-up" && (
                  <p className="text-xs text-muted-foreground">
                    At least {MIN_PASSWORD_LENGTH} characters.
                  </p>
                )}
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Please wait..." : mode === "sign-in" ? "Sign in" : "Create account"}
              </Button>
            </form>
            <div className="my-4 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={submitting}
              onClick={() => void handleGoogle()}
            >
              Continue with Google
            </Button>
            <button
              type="button"
              className="mt-4 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
            >
              {mode === "sign-in"
                ? "Need an account? Create one"
                : "Already have an account? Sign in"}
            </button>
          </>
        )}
      </CardContent>
    </AuthLayout>
  );
}
