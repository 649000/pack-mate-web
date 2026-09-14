"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { TotpSecret } from "firebase/auth";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  beginTotpEnrollment,
  completeTotpEnrollment,
  hasPasswordProvider,
  isMfaEnabled,
  removeSecondFactor,
  sendVerificationEmail,
} from "@/lib/account";
import { ReauthField } from "./reauth-field";

export function TwoFactorDialog({
  open,
  onOpenChange,
  onChanged,
  emailVerified,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void | Promise<void>;
  emailVerified: boolean;
}) {
  const { user } = useAuth();
  const enabled = user ? isMfaEnabled(user) : false;
  const needsPassword = user ? hasPasswordProvider(user) : false;

  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState<TotpSecret | null>(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setPassword("");
    setSecret(null);
    setCode("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleSendVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await sendVerificationEmail();
      toast.success("Verification email sent. Verify, then reopen this dialog.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send verification email");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBegin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const next = await beginTotpEnrollment(needsPassword ? password : undefined);
      setSecret(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start setup");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!secret) return;
    setSubmitting(true);
    try {
      await completeTotpEnrollment(secret, code.trim(), "Authenticator app");
      toast.success("Two-factor authentication enabled");
      await onChanged();
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid code");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await removeSecondFactor(needsPassword ? password : undefined);
      toast.success("Two-factor authentication removed");
      await onChanged();
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove two-factor");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {enabled ? (
          <form onSubmit={handleRemove}>
            <DialogHeader>
              <DialogTitle>Remove two-factor authentication</DialogTitle>
              <DialogDescription>
                Your account will no longer require a code from your authenticator app.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <ReauthField
                needsPassword={needsPassword}
                password={password}
                onPasswordChange={setPassword}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={submitting}>
                {submitting ? "Removing..." : "Remove"}
              </Button>
            </DialogFooter>
          </form>
        ) : !emailVerified ? (
          <form onSubmit={handleSendVerification}>
            <DialogHeader>
              <DialogTitle>Verify your email first</DialogTitle>
              <DialogDescription>
                A verified email is required before you can add a second factor. We will send a link
                to {user?.email}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending..." : "Send verification email"}
              </Button>
            </DialogFooter>
          </form>
        ) : secret ? (
          <form onSubmit={handleConfirm}>
            <DialogHeader>
              <DialogTitle>Scan and verify</DialogTitle>
              <DialogDescription>
                Add this key to your authenticator app, then enter the six-digit code it shows.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <Label>Setup key</Label>
                <code className="block overflow-x-auto rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm tracking-wider">
                  {secret.secretKey}
                </code>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="totp-code">Verification code</Label>
                <Input
                  id="totp-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Verifying..." : "Enable"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleBegin}>
            <DialogHeader>
              <DialogTitle>Set up two-factor authentication</DialogTitle>
              <DialogDescription>
                Protect your account with a code from an authenticator app. Keep a backup of the
                setup key: there is no self-service recovery if you lose your device.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <ReauthField
                needsPassword={needsPassword}
                password={password}
                onPasswordChange={setPassword}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Starting..." : "Continue"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
