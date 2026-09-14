import {
  EmailAuthProvider,
  GoogleAuthProvider,
  TotpMultiFactorGenerator,
  deleteUser,
  getMultiFactorResolver,
  linkWithCredential,
  linkWithPopup,
  multiFactor,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  unlink,
  updatePassword,
  verifyBeforeUpdateEmail,
  type AuthCredential,
  type AuthError,
  type MultiFactorError,
  type MultiFactorResolver,
  type TotpSecret,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebase";
import { collectUserData, deleteAllUserData, type ExportedData } from "./data";
import { validateEmail, validatePassword } from "./validation";

export const GOOGLE_PROVIDER_ID = "google.com";
export const PASSWORD_PROVIDER_ID = "password";

export function currentUser(): User {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("You must be signed in");
  return user;
}

export function linkedProviderIds(user: User): string[] {
  return user.providerData.map((provider) => provider.providerId);
}

export function hasPasswordProvider(user: User): boolean {
  return linkedProviderIds(user).includes(PASSWORD_PROVIDER_ID);
}

export function hasGoogleProvider(user: User): boolean {
  return linkedProviderIds(user).includes(GOOGLE_PROVIDER_ID);
}

export function isMfaEnabled(user: User): boolean {
  return multiFactor(user).enrolledFactors.length > 0;
}

// ---------------------------------------------------------------------------
// Re-authentication
//
// Firebase requires a recent login for sensitive operations. Password accounts
// re-authenticate with the password; Google accounts with a popup.
// ---------------------------------------------------------------------------

export async function reauthenticate(password?: string): Promise<void> {
  const user = currentUser();
  if (hasPasswordProvider(user)) {
    if (!password) throw new Error("Enter your password to continue");
    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email ?? "", password),
    );
    return;
  }
  if (hasGoogleProvider(user)) {
    await reauthenticateWithPopup(user, new GoogleAuthProvider());
    return;
  }
  throw new Error("This account has no way to re-authenticate");
}

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------

export function isEmailVerified(user: User): boolean {
  return user.emailVerified;
}

export async function sendVerificationEmail(): Promise<void> {
  const user = currentUser();
  if (user.emailVerified) return;
  await firebaseSendEmailVerification(user);
}

export async function refreshUser(): Promise<User> {
  const user = currentUser();
  await user.reload();
  return getFirebaseAuth().currentUser ?? user;
}

export async function sendPasswordReset(email: string): Promise<void> {
  const address = validateEmail(email);
  // Firebase does not disclose whether the address has an account.
  await firebaseSendPasswordResetEmail(getFirebaseAuth(), address);
}

// ---------------------------------------------------------------------------
// Email and password
// ---------------------------------------------------------------------------

export async function changeEmail(newEmail: string, password?: string): Promise<void> {
  const email = validateEmail(newEmail);
  const user = currentUser();
  await reauthenticate(password);
  await verifyBeforeUpdateEmail(user, email);
}

export async function changePassword(newPassword: string, password?: string): Promise<void> {
  const next = validatePassword(newPassword);
  const user = currentUser();
  await reauthenticate(password);
  await updatePassword(user, next);
}

export async function setPassword(newPassword: string): Promise<void> {
  const next = validatePassword(newPassword);
  const user = currentUser();
  await reauthenticate();
  await linkWithCredential(user, EmailAuthProvider.credential(user.email ?? "", next));
}

// ---------------------------------------------------------------------------
// Linked providers
// ---------------------------------------------------------------------------

export function isAccountExistsError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "auth/account-exists-with-different-credential"
  );
}

export function pendingCredentialFrom(error: unknown): AuthCredential | null {
  if (typeof error === "object" && error !== null && "credential" in error) {
    return (error as { credential?: AuthCredential }).credential ?? null;
  }
  return null;
}

export function accountEmailFrom(error: unknown): string | null {
  return (error as AuthError).customData?.email ?? null;
}

export function linkErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code: string }).code
      : undefined;
  switch (code) {
    case "auth/provider-already-linked":
      return "Google is already linked to this account";
    case "auth/credential-already-in-use":
      return "That Google account is already linked to another account";
    case "auth/email-already-in-use":
      return "That email is already in use by another account";
    default:
      return error instanceof Error ? error.message : "Could not link Google";
  }
}

export async function linkGoogle(password?: string): Promise<void> {
  const user = currentUser();
  if (hasGoogleProvider(user)) throw new Error("Google is already linked to this account");
  await reauthenticate(password);
  try {
    await linkWithPopup(user, new GoogleAuthProvider());
  } catch (error) {
    throw new Error(linkErrorMessage(error));
  }
}

export async function linkPendingCredential(credential: AuthCredential): Promise<void> {
  try {
    await linkWithCredential(currentUser(), credential);
  } catch (error) {
    throw new Error(linkErrorMessage(error));
  }
}

export async function unlinkGoogle(password?: string): Promise<void> {
  const user = currentUser();
  if (!hasGoogleProvider(user)) throw new Error("Google is not linked to this account");
  if (!hasPasswordProvider(user)) {
    throw new Error("Set a password before unlinking Google, or you will lose access");
  }
  await reauthenticate(password);
  await unlink(user, GOOGLE_PROVIDER_ID);
}

// ---------------------------------------------------------------------------
// Two-factor authentication (TOTP)
// ---------------------------------------------------------------------------

export async function beginTotpEnrollment(password?: string): Promise<TotpSecret> {
  const user = currentUser();
  await reauthenticate(password);
  const session = await multiFactor(user).getSession();
  return TotpMultiFactorGenerator.generateSecret(session);
}

export async function completeTotpEnrollment(
  secret: TotpSecret,
  code: string,
  displayName: string,
): Promise<void> {
  const user = currentUser();
  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code);
  await multiFactor(user).enroll(assertion, displayName);
}

export async function removeSecondFactor(password?: string): Promise<void> {
  const user = currentUser();
  await reauthenticate(password);
  const factors = multiFactor(user).enrolledFactors;
  await Promise.all(factors.map((factor) => multiFactor(user).unenroll(factor)));
}

// ---------------------------------------------------------------------------
// Multi-factor sign-in
// ---------------------------------------------------------------------------

export class MfaRequiredError extends Error {
  readonly resolver: MultiFactorResolver;

  constructor(resolver: MultiFactorResolver) {
    super("Two-factor authentication required");
    this.name = "MfaRequiredError";
    this.resolver = resolver;
  }
}

export function isMfaRequiredError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "auth/multi-factor-auth-required"
  );
}

export function mfaResolverFrom(error: unknown): MultiFactorResolver {
  return getMultiFactorResolver(getFirebaseAuth(), error as MultiFactorError);
}

export async function resolveMfaSignIn(resolver: MultiFactorResolver, code: string): Promise<void> {
  const hint = resolver.hints[0];
  if (!hint) throw new Error("No second factor is available for this account");
  const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code);
  await resolver.resolveSignIn(assertion);
}

// ---------------------------------------------------------------------------
// Export and deletion
// ---------------------------------------------------------------------------

export const EXPORT_SCHEMA_VERSION = 1;

export type ExportPayload = {
  schemaVersion: number;
  exportedAt: string;
} & ExportedData;

export function buildExportPayload(data: ExportedData, exportedAt: string): ExportPayload {
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt,
    profile: data.profile,
    reusable_items: data.reusable_items,
    reusable_bags: data.reusable_bags,
    reusable_bag_items: data.reusable_bag_items,
    trips: data.trips,
    trip_bags: data.trip_bags,
    trip_entries: data.trip_entries,
  };
}

export async function exportUserData(
  exportedAt = new Date().toISOString(),
): Promise<ExportPayload> {
  return buildExportPayload(await collectUserData(), exportedAt);
}

export function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function deleteAccount(password?: string): Promise<void> {
  const user = currentUser();
  await reauthenticate(password);
  // Remove the user's data first; if this fails the auth account is preserved
  // so the user can retry, and no rows are orphaned.
  await deleteAllUserData();
  await deleteUser(user);
}
