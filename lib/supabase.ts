import { createClient } from "@supabase/supabase-js";
import { publicConfig } from "./public-config";
import { getFirebaseAuth } from "./firebase";

// Identity is Firebase Auth. Supabase trusts the Firebase ID token via its
// third-party auth integration, so the client supplies the token on every
// request and never uses Supabase's own session handling.
export const supabase = createClient(
  publicConfig.supabase.url,
  publicConfig.supabase.publishableKey,
  {
    db: {
      schema: "packmate",
    },
    accessToken: async () => {
      const user = getFirebaseAuth().currentUser;
      return user ? await user.getIdToken() : null;
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);
