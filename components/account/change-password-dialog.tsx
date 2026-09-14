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
import { changePassword, hasPasswordProvider, setPassword } from "@/lib/account";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation";
import { ReauthField } from "./reauth-field";

export function ChangePasswordDialog({
  open,
  onOpenChange,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void | Promise<void>;
}) {
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const needsPassword = user ? hasPasswordProvider(user) : false;

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (next !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      if (needsPassword) {
        await changePassword(next, current);
        toast.success("Password updated");
      } else {
        await setPassword(next);
        toast.success("Password set. You can now sign in with email and password.");
      }
      await onChanged?.();
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{needsPassword ? "Change password" : "Set a password"}</DialogTitle>
            <DialogDescription>
              {needsPassword
                ? "Choose a new password for your account."
                : "Add a password so you can sign in without Google."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {needsPassword && (
              <ReauthField
                needsPassword={needsPassword}
                password={current}
                onPasswordChange={setCurrent}
                id="current-password"
              />
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={next}
                onChange={(event) => setNext(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                At least {MIN_PASSWORD_LENGTH} characters.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : needsPassword ? "Update password" : "Set password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
