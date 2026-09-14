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
import { hasPasswordProvider, unlinkGoogle } from "@/lib/account";
import { ReauthField } from "./reauth-field";

export function UnlinkGoogleDialog({
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
      await unlinkGoogle(needsPassword ? password : undefined);
      toast.success("Google unlinked");
      await onChanged();
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unlink Google");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Unlink Google</DialogTitle>
            <DialogDescription>
              You will no longer be able to sign in with Google. Your password remains.
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
              {submitting ? "Unlinking..." : "Unlink Google"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
