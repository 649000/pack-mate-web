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
import { hasPasswordProvider, linkGoogle } from "@/lib/account";
import { ReauthField } from "./reauth-field";

export function LinkGoogleDialog({
  open,
  onOpenChange,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void | Promise<void>;
}) {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const needsPassword = user ? hasPasswordProvider(user) : false;

  function reset() {
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
      await linkGoogle(needsPassword ? password : undefined);
      toast.success("Google linked");
      await onChanged();
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to link Google");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Link Google</DialogTitle>
            <DialogDescription>Add Google as a sign-in method for this account.</DialogDescription>
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
              {submitting ? "Linking..." : "Link Google"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
