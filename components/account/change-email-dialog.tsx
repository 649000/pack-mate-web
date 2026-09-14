"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
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
import { changeEmail, hasPasswordProvider } from "@/lib/account";
import { validateEmail } from "@/lib/validation";
import { ReauthField } from "./reauth-field";

export function ChangeEmailDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const needsPassword = user ? hasPasswordProvider(user) : false;

  function reset() {
    setEmail("");
    setPassword("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const next = validateEmail(email);
      await changeEmail(next, needsPassword ? password : undefined);
      toast.success(`Verification link sent to ${next}`);
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change email");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change email</DialogTitle>
            <DialogDescription>
              We will send a verification link to the new address. Your email only changes after you
              confirm it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-email">New email</Label>
              <Input
                id="new-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
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
              {submitting ? "Sending..." : "Send verification link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
