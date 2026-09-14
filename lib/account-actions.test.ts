import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  currentUser: null as unknown,
}));

const authFns = vi.hoisted(() => {
  const mfaUser = {
    enrolledFactors: [] as { uid: string }[],
    getSession: vi.fn(async () => "session"),
    enroll: vi.fn(async () => undefined),
    unenroll: vi.fn(async () => undefined),
  };
  return {
    mfaUser,
    deleteUser: vi.fn(async () => undefined),
    unlink: vi.fn(async () => undefined),
    reload: vi.fn(async () => undefined),
    reauthenticateWithCredential: vi.fn(async () => undefined),
    reauthenticateWithPopup: vi.fn(async () => undefined),
    updatePassword: vi.fn(async () => undefined),
    verifyBeforeUpdateEmail: vi.fn(async () => undefined),
    sendEmailVerification: vi.fn(async () => undefined),
    sendPasswordResetEmail: vi.fn(async () => undefined),
    linkWithCredential: vi.fn(async () => undefined),
    linkWithPopup: vi.fn(async () => undefined),
    multiFactor: vi.fn(() => mfaUser),
    EmailAuthProvider: { credential: vi.fn(() => ({ kind: "password" })) },
    GoogleAuthProvider: class {},
    TotpMultiFactorGenerator: {
      generateSecret: vi.fn(async () => "SECRET"),
      assertionForEnrollment: vi.fn(() => ({ kind: "enroll" })),
      assertionForSignIn: vi.fn(() => ({ kind: "signin" })),
    },
    getMultiFactorResolver: vi.fn(() => ({ hints: [] })),
  };
});

const dataFns = vi.hoisted(() => ({
  collectUserData: vi.fn(async () => ({})),
  deleteAllUserData: vi.fn(async () => undefined),
}));

vi.mock("firebase/auth", () => authFns);
vi.mock("./data", () => dataFns);
vi.mock("./firebase", () => ({ getFirebaseAuth: () => state }));

import type { AuthCredential } from "firebase/auth";
import {
  accountEmailFrom,
  beginTotpEnrollment,
  completeTotpEnrollment,
  deleteAccount,
  isAccountExistsError,
  linkErrorMessage,
  linkGoogle,
  linkPendingCredential,
  pendingCredentialFrom,
  refreshUser,
  removeSecondFactor,
  sendPasswordReset,
  sendVerificationEmail,
  unlinkGoogle,
} from "./account";

function user(providerIds: string[], email = "ada@example.com", emailVerified = false) {
  return {
    email,
    emailVerified,
    providerData: providerIds.map((providerId) => ({ providerId })),
    reload: authFns.reload,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  authFns.mfaUser.enrolledFactors = [];
  state.currentUser = user(["password", "google.com"]);
});

describe("unlinkGoogle", () => {
  it("unlinks when a password is also set", async () => {
    state.currentUser = user(["password", "google.com"]);
    await unlinkGoogle("secret123");
    expect(authFns.reauthenticateWithCredential).toHaveBeenCalled();
    expect(authFns.unlink).toHaveBeenCalledWith(state.currentUser, "google.com");
  });

  it("refuses to unlink when Google is the only sign-in method", async () => {
    state.currentUser = user(["google.com"]);
    await expect(unlinkGoogle()).rejects.toThrow(/set a password/i);
    expect(authFns.unlink).not.toHaveBeenCalled();
  });

  it("reports when Google is not linked", async () => {
    state.currentUser = user(["password"]);
    await expect(unlinkGoogle("secret123")).rejects.toThrow(/not linked/i);
  });
});

describe("deleteAccount", () => {
  it("removes data before deleting the authentication account", async () => {
    state.currentUser = user(["password"]);
    const order: string[] = [];
    dataFns.deleteAllUserData.mockImplementation(async () => {
      order.push("data");
    });
    authFns.deleteUser.mockImplementation(async () => {
      order.push("auth");
    });

    await deleteAccount("secret123");

    expect(order).toEqual(["data", "auth"]);
  });

  it("does not delete the authentication account when data removal fails", async () => {
    state.currentUser = user(["password"]);
    dataFns.deleteAllUserData.mockRejectedValue(new Error("network down"));

    await expect(deleteAccount("secret123")).rejects.toThrow(/network down/i);
    expect(authFns.deleteUser).not.toHaveBeenCalled();
  });
});

describe("email verification", () => {
  it("sends a verification email when the address is unverified", async () => {
    state.currentUser = user(["password"], "ada@example.com", false);
    await sendVerificationEmail();
    expect(authFns.sendEmailVerification).toHaveBeenCalledWith(state.currentUser);
  });

  it("does not resend when the address is already verified", async () => {
    state.currentUser = user(["password"], "ada@example.com", true);
    await sendVerificationEmail();
    expect(authFns.sendEmailVerification).not.toHaveBeenCalled();
  });

  it("reloads the user to refresh the verification status", async () => {
    state.currentUser = user(["password"]);
    await refreshUser();
    expect(authFns.reload).toHaveBeenCalled();
  });
});

describe("linking Google", () => {
  it("re-authenticates and links Google for a password account", async () => {
    state.currentUser = user(["password"]);
    await linkGoogle("secret123");
    expect(authFns.reauthenticateWithCredential).toHaveBeenCalled();
    expect(authFns.linkWithPopup).toHaveBeenCalledWith(state.currentUser, expect.anything());
  });

  it("reports when Google is already linked", async () => {
    state.currentUser = user(["password", "google.com"]);
    await expect(linkGoogle("secret123")).rejects.toThrow(/already linked/i);
    expect(authFns.linkWithPopup).not.toHaveBeenCalled();
  });

  it("maps a credential-in-use error to a clear message", async () => {
    state.currentUser = user(["password"]);
    authFns.linkWithPopup.mockRejectedValueOnce({ code: "auth/credential-already-in-use" });
    await expect(linkGoogle("secret123")).rejects.toThrow(/another account/i);
  });

  it("links a pending credential from a collision", async () => {
    state.currentUser = user(["password"]);
    const credential = { kind: "google" } as unknown as AuthCredential;
    await linkPendingCredential(credential);
    expect(authFns.linkWithCredential).toHaveBeenCalledWith(state.currentUser, credential);
  });
});

describe("collision helpers", () => {
  it("detects the account-exists error", () => {
    expect(isAccountExistsError({ code: "auth/account-exists-with-different-credential" })).toBe(
      true,
    );
    expect(isAccountExistsError({ code: "auth/wrong-password" })).toBe(false);
    expect(isAccountExistsError(null)).toBe(false);
  });

  it("reads the pending credential and email", () => {
    const error = {
      code: "auth/account-exists-with-different-credential",
      credential: { kind: "google" },
      customData: { email: "ada@example.com" },
    };
    expect(pendingCredentialFrom(error)).toEqual({ kind: "google" });
    expect(accountEmailFrom(error)).toBe("ada@example.com");
  });

  it("maps known link error codes", () => {
    expect(linkErrorMessage({ code: "auth/provider-already-linked" })).toMatch(/already linked/i);
    expect(linkErrorMessage({ code: "auth/email-already-in-use" })).toMatch(/in use/i);
  });
});

describe("password reset", () => {
  it("sends a reset message for a valid address", async () => {
    await sendPasswordReset("ada@example.com");
    expect(authFns.sendPasswordResetEmail).toHaveBeenCalledWith(state, "ada@example.com");
  });

  it("rejects an invalid address without sending", async () => {
    await expect(sendPasswordReset("nope")).rejects.toThrow();
    expect(authFns.sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});

describe("two-factor enrollment", () => {
  it("generates a secret after re-authenticating", async () => {
    state.currentUser = user(["password"]);
    const secret = await beginTotpEnrollment("secret123");
    expect(secret).toBe("SECRET");
    expect(authFns.reauthenticateWithCredential).toHaveBeenCalled();
    expect(authFns.TotpMultiFactorGenerator.generateSecret).toHaveBeenCalledWith("session");
  });

  it("enrolls the authenticator with the provided code", async () => {
    state.currentUser = user(["password"]);
    await completeTotpEnrollment(
      "SECRET" as unknown as Parameters<typeof completeTotpEnrollment>[0],
      "123456",
      "Authenticator app",
    );
    expect(authFns.TotpMultiFactorGenerator.assertionForEnrollment).toHaveBeenCalledWith(
      "SECRET",
      "123456",
    );
    expect(authFns.mfaUser.enroll).toHaveBeenCalledWith({ kind: "enroll" }, "Authenticator app");
  });

  it("removes every enrolled second factor", async () => {
    state.currentUser = user(["password"]);
    authFns.mfaUser.enrolledFactors = [{ uid: "f1" }, { uid: "f2" }];
    await removeSecondFactor("secret123");
    expect(authFns.mfaUser.unenroll).toHaveBeenCalledTimes(2);
    expect(authFns.mfaUser.unenroll).toHaveBeenCalledWith({ uid: "f1" });
    expect(authFns.mfaUser.unenroll).toHaveBeenCalledWith({ uid: "f2" });
  });
});
