"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReauthField({
  needsPassword,
  password,
  onPasswordChange,
  id = "reauth-password",
}: {
  needsPassword: boolean;
  password: string;
  onPasswordChange: (value: string) => void;
  id?: string;
}) {
  if (!needsPassword) {
    return (
      <p className="text-sm text-muted-foreground">
        You will be asked to confirm this action with Google.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>Current password</Label>
      <Input
        id={id}
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
      />
    </div>
  );
}
