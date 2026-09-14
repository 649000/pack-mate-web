"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardHeading,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  hasGoogleProvider,
  hasPasswordProvider,
  isMfaEnabled,
  refreshUser,
  sendVerificationEmail,
} from "@/lib/account";
import { ChangeEmailDialog } from "./change-email-dialog";
import { ChangePasswordDialog } from "./change-password-dialog";
import { LinkGoogleDialog } from "./link-google-dialog";
import { SettingRow } from "./setting-row";
import { TwoFactorDialog } from "./two-factor-dialog";
import { UnlinkGoogleDialog } from "./unlink-google-dialog";

export function AccountCard({ onChanged }: { onChanged: () => void | Promise<void> }) {
  const { user } = useAuth();
  const [emailOpen, setEmailOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [emailVerified, setEmailVerified] = useState(user?.emailVerified ?? false);
  const [sendingLink, setSendingLink] = useState(false);

  function refreshVerification() {
    return refreshUser()
      .then((fresh) => {
        setEmailVerified(fresh.emailVerified);
      })
      .catch(() => {
        // Not signed in yet; the context user will supply the initial value.
      });
  }

  useEffect(() => {
    void refreshVerification();
  }, []);

  if (!user) return null;

  const passwordSet = hasPasswordProvider(user);
  const googleLinked = hasGoogleProvider(user);
  const mfaEnabled = isMfaEnabled(user);
  const googleEmail = user.providerData.find(
    (provider) => provider.providerId === "google.com",
  )?.email;

  async function handleSendVerification() {
    setSendingLink(true);
    try {
      await sendVerificationEmail();
      toast.success("Verification email sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send verification email");
    } finally {
      setSendingLink(false);
    }
  }

  return (
    <Card className="pb-2.5">
      <CardHeader>
        <CardHeading>
          <CardTitle>Account</CardTitle>
          <CardDescription>Sign-in methods and security.</CardDescription>
        </CardHeading>
      </CardHeader>
      <CardContent className="grid gap-5 pt-7.5">
        <SettingRow
          badge={<Mail className="text-xl text-muted-foreground" />}
          title="Email"
          description={
            <span className="flex flex-wrap items-center gap-2">
              {user.email}
              <Badge size="sm" variant={emailVerified ? "success" : "secondary"} appearance="light">
                {emailVerified ? "Verified" : "Not verified"}
              </Badge>
            </span>
          }
          action={
            <div className="flex items-center gap-2">
              {!emailVerified && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sendingLink}
                  onClick={() => void handleSendVerification()}
                >
                  {sendingLink ? "Sending..." : "Send link"}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setEmailOpen(true)}>
                Change
              </Button>
            </div>
          }
        />

        <SettingRow
          badge={<KeyRound className="text-xl text-muted-foreground" />}
          title="Password"
          description={passwordSet ? "Set" : "Not set"}
          action={
            <Button variant="outline" size="sm" onClick={() => setPasswordOpen(true)}>
              {passwordSet ? "Change" : "Set"}
            </Button>
          }
        />

        <SettingRow
          badge={<ShieldCheck className="text-xl text-muted-foreground" />}
          title="Two-factor authentication"
          description={mfaEnabled ? "Enabled with an authenticator app" : "Not enabled"}
          action={
            <Switch
              aria-label="Two-factor authentication"
              checked={mfaEnabled}
              onCheckedChange={() => setTwoFactorOpen(true)}
            />
          }
        />

        <SettingRow
          badge={<Image src="/media/brand-logos/google.svg" width={20} height={20} alt="" />}
          title="Sign-in with Google"
          description={
            googleLinked
              ? (googleEmail ?? "Linked")
              : "Not linked. Google sign-in is available on the sign-in page."
          }
          action={
            googleLinked ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={!passwordSet}
                title={passwordSet ? undefined : "Set a password before unlinking Google"}
                onClick={() => setUnlinkOpen(true)}
              >
                Unlink
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setLinkOpen(true)}>
                Link
              </Button>
            )
          }
        />
      </CardContent>

      <ChangeEmailDialog open={emailOpen} onOpenChange={setEmailOpen} />
      <ChangePasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        onChanged={onChanged}
      />
      <TwoFactorDialog
        open={twoFactorOpen}
        onOpenChange={(open) => {
          setTwoFactorOpen(open);
          if (!open) void refreshVerification();
        }}
        onChanged={onChanged}
        emailVerified={emailVerified}
      />
      <UnlinkGoogleDialog open={unlinkOpen} onOpenChange={setUnlinkOpen} onChanged={onChanged} />
      <LinkGoogleDialog open={linkOpen} onOpenChange={setLinkOpen} onChanged={onChanged} />
    </Card>
  );
}
