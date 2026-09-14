"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { deleteAccount, hasPasswordProvider } from "@/lib/account";
import { ReauthField } from "./reauth-field";

export function DeleteAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const needsPassword = user ? hasPasswordProvider(user) : false;

  function reset() {
    setConfirmed(false);
    setPassword("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmed) {
      toast.error("Confirm that you want to delete your account");
      return;
    }
    setSubmitting(true);
    try {
      await deleteAccount(needsPassword ? password : undefined);
      toast.success("Your account has been deleted");
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete account");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              This permanently removes your profile, trips, bags and items. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="confirm-delete"
                checked={confirmed}
                onCheckedChange={(value) => setConfirmed(value === true)}
              />
              <Label htmlFor="confirm-delete" className="text-sm font-normal">
                I understand this is permanent
              </Label>
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
            <Button type="submit" variant="destructive" disabled={submitting || !confirmed}>
              {submitting ? "Deleting..." : "Delete account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
