// Public client configuration. These values ship to the browser and are not
// secrets: the Firebase web API key is an identifier, and the Supabase
// publishable key is gated by RLS. Committed on purpose so builds and CI
// need no configuration. No local env vars are required.
export const publicConfig = {
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
