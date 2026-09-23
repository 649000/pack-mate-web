"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layouts/page-header";
import { AccountCard } from "@/components/account/account-card";
import { DataCard } from "@/components/account/data-card";
import { PersonalInfoCard } from "@/components/account/personal-info-card";
import { getProfile } from "@/lib/data";
import type { UserProfile } from "@/lib/types";

export function AccountView() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  function refresh() {
    return getProfile()
      .then((data) => {
        setProfile(data);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Failed to load profile");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <PageHeader
        title="Account"
        description="Manage your profile, security and data."
        breadcrumb={[{ label: "Pack Mate" }, { label: "Account" }]}
      />
      <div className="grid gap-5">
        <PersonalInfoCard profile={profile} loading={loading} onSaved={refresh} />
        <AccountCard onChanged={refresh} />
        <DataCard />
      </div>
    </div>
  );
}

export default function AccountPage() {
  return <AccountView />;
}
