"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/auth-provider";
import { getProfile } from "@/lib/data";

// Applies the signed-in user's stored theme once their profile loads, so the
// choice follows them across devices. The theme library's local cache still
// renders the right theme before hydration on a returning device.
export function ThemeSync() {
  const { user } = useAuth();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!user) return;
    let active = true;
    getProfile()
      .then((profile) => {
        if (active && profile?.theme) setTheme(profile.theme);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user, setTheme]);

  return null;
}
