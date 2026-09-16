import { z } from "zod";

// Public client configuration. These values ship to the browser and are not
// secrets: the Firebase web API key is an identifier, and the Supabase
// publishable key is gated by RLS. Values are environment-driven via
// NEXT_PUBLIC_* so a build can target a non-production backend; when a value is
// absent the committed default below is used, so no local env file is required
// for a normal production build. Invalid values fail fast at load.
const publicConfigSchema = z.object({
  firebase: z.object({
    apiKey: z.string().min(1),
    authDomain: z.string().min(1),
    projectId: z.string().min(1),
    appId: z.string().min(1),
  }),
  supabase: z.object({
    url: z.string().url(),
    publishableKey: z.string().min(1),
  }),
});

const defaults = {
  firebase: {
    apiKey: "AIzaSyCPhmz87YQq0onNJtk5Be-m5JWNk-hEL0c",
    authDomain: "pack-mate-37305.firebaseapp.com",
    projectId: "pack-mate-37305",
    appId: "1:890432736272:web:92351fda430e92f688ce95",
  },
  supabase: {
    url: "https://llhzdoqqdndjdrqdzzuc.supabase.co",
    publishableKey: "sb_publishable_pnFnUFqXKc6NN2e-DC39hg_KUd-PUFR",
  },
} as const;

const candidate = {
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? defaults.firebase.apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? defaults.firebase.authDomain,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? defaults.firebase.projectId,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? defaults.firebase.appId,
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? defaults.supabase.url,
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? defaults.supabase.publishableKey,
  },
};

const parsed = publicConfigSchema.safeParse(candidate);

if (!parsed.success) {
  throw new Error(`Invalid public configuration: ${parsed.error.message}`);
}

export const publicConfig = parsed.data;
