const { setGlobalOptions } = require("firebase-functions/v2");
const { beforeUserCreated, beforeUserSignedIn } = require("firebase-functions/v2/identity");

// Run next to the Supabase database (ap-southeast-1) to keep auth hooks local.
setGlobalOptions({ region: "asia-southeast1" });

// Supabase assigns the Postgres role from the JWT `role` claim. Firebase ID
// tokens do not include one, so without this every request would run as `anon`.
// Stamp `authenticated` on every sign-up and sign-in.
exports.beforecreated = beforeUserCreated(() => ({
  customClaims: { role: "authenticated" },
}));

exports.beforesignedin = beforeUserSignedIn(() => ({
  customClaims: { role: "authenticated" },
}));
