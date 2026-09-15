"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardHeading,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertProfile } from "@/lib/data";
import { initials } from "@/lib/utils";
import { GENDERS } from "@/lib/validation";
import type { DisplayWeightUnit, UserProfile } from "@/lib/types";

const GENDER_LABELS = new Map<string, string>([
  ["female", "Female"],
  ["male", "Male"],
  ["other", "Other"],
  ["prefer_not_to_say", "Prefer not to say"],
]);

function ProfileForm({
  profile,
  loading,
  onSaved,
}: {
  profile: UserProfile | null;
  loading: boolean;
  onSaved: () => void | Promise<void>;
}) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [birthday, setBirthday] = useState(profile?.birthday ?? "");
  const [gender, setGender] = useState(profile?.gender ?? "");
  const [weightUnit, setWeightUnit] = useState<DisplayWeightUnit>(profile?.weight_unit ?? "kg");
  const [saving, setSaving] = useState(false);

  const email = user?.email ?? "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await upsertProfile({
        displayName: displayName || null,
        birthday: birthday || null,
        gender: gender || null,
        weightUnit,
      });
      toast.success("Profile saved");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="grid gap-5 pt-7.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <Label className="flex w-full max-w-56">Photo</Label>
          <div className="flex grow items-center gap-3.5">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-lg font-semibold text-muted-foreground">
              {initials(displayName || email)}
            </div>
            <span className="text-sm text-muted-foreground">
              Your initials are shown until avatars are supported.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline gap-2.5 lg:flex-nowrap">
          <Label htmlFor="profile-name" className="flex w-full max-w-56">
            Name
          </Label>
          <Input
            id="profile-name"
            className="grow"
            value={displayName}
            maxLength={80}
            placeholder="Not set"
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-baseline gap-2.5 lg:flex-nowrap">
          <Label htmlFor="profile-birthday" className="flex w-full max-w-56">
            Birthday
          </Label>
          <Input
            id="profile-birthday"
            className="grow"
            type="date"
            value={birthday}
            onChange={(event) => setBirthday(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 lg:flex-nowrap">
          <Label htmlFor="profile-gender" className="flex w-full max-w-56">
            Gender
          </Label>
          <div className="grow">
            <Select
              value={gender || "none"}
              onValueChange={(value) => setGender(value === "none" ? "" : value)}
            >
              <SelectTrigger id="profile-gender">
                <SelectValue placeholder="Not set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not set</SelectItem>
                {GENDERS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {GENDER_LABELS.get(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 lg:flex-nowrap">
          <Label htmlFor="profile-weight-unit" className="flex w-full max-w-56">
            Weight unit
          </Label>
          <div className="grow">
            <Select
              value={weightUnit}
              onValueChange={(value) => setWeightUnit(value as DisplayWeightUnit)}
            >
              <SelectTrigger id="profile-weight-unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                <SelectItem value="lb">Pounds (lb)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end pt-2.5">
          <Button type="submit" disabled={saving || loading}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}

export function PersonalInfoCard({
  profile,
  loading,
  onSaved,
}: {
  profile: UserProfile | null;
  loading: boolean;
  onSaved: () => void | Promise<void>;
}) {
  return (
    <Card className="pb-2.5">
      <CardHeader>
        <CardHeading>
          <CardTitle>Personal Info</CardTitle>
          <CardDescription>All fields are optional.</CardDescription>
        </CardHeading>
      </CardHeader>
      <ProfileForm
        key={profile?.updated_at ?? "empty"}
        profile={profile}
        loading={loading}
        onSaved={onSaved}
      />
    </Card>
  );
}
