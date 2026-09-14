"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardHeading,
  CardTitle,
} from "@/components/ui/card";
import { downloadJson, exportUserData } from "@/lib/account";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { SettingRow } from "./setting-row";

export function DataCard() {
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const payload = await exportUserData();
      downloadJson(`pack-mate-export-${payload.exportedAt.slice(0, 10)}.json`, payload);
      toast.success("Export downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export data");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Card className="pb-2.5">
      <CardHeader>
        <CardHeading>
          <CardTitle>Data &amp; Privacy</CardTitle>
          <CardDescription>Download a copy of your data, or delete your account.</CardDescription>
        </CardHeading>
      </CardHeader>
      <CardContent className="grid gap-5 pt-7.5">
        <SettingRow
          badge={<Download className="text-xl text-muted-foreground" />}
          title="Export your data"
          description="Download your profile, trips, bags and items as JSON."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleExport()}
              disabled={exporting}
            >
              {exporting ? "Preparing..." : "Export data"}
            </Button>
          }
        />

        <SettingRow
          badge={<Trash2 className="text-xl text-destructive" />}
          title="Delete account"
          description="Permanently remove your account and everything in it."
          action={
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              Delete account
            </Button>
          }
        />
      </CardContent>

      <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </Card>
  );
}
