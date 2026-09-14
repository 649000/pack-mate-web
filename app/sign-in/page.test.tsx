import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MultiFactorResolver } from "firebase/auth";

const replace = vi.fn();
const signIn = vi.fn();
const signUp = vi.fn();
const signInWithGoogle = vi.fn();
const resolveMfa = vi.fn();

const accountMocks = vi.hoisted(() => {
  class MfaRequiredError extends Error {
    resolver: unknown;
    constructor(resolver: unknown) {
      super("Two-factor authentication required");
      this.name = "MfaRequiredError";
      this.resolver = resolver;
    }
  }
  return {
    MfaRequiredError,
    isAccountExistsError: (error: unknown) =>
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "auth/account-exists-with-different-credential",
    pendingCredentialFrom: (error: unknown) =>
      (error as { credential?: unknown }).credential ?? null,
    accountEmailFrom: (error: unknown) =>
      (error as { customData?: { email?: string } }).customData?.email ?? null,
    linkPendingCredential: vi.fn(),
  };
});

vi.mock("@/lib/account", () => ({
  MfaRequiredError: accountMocks.MfaRequiredError,
  isAccountExistsError: accountMocks.isAccountExistsError,
  pendingCredentialFrom: accountMocks.pendingCredentialFrom,
  accountEmailFrom: accountMocks.accountEmailFrom,
  linkPendingCredential: accountMocks.linkPendingCredential,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn,
    signUp,
    signInWithGoogle,
    resolveMfa,
    signOut: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { MfaRequiredError } from "@/lib/account";
import SignInPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SignInPage", () => {
  it("offers email, password and Google", () => {
    render(<SignInPage />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
  });

  it("toggles to create account", async () => {
    const user = userEvent.setup();
    render(<SignInPage />);
    await user.click(screen.getByRole("button", { name: /create one/i }));
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("signs in with email and password", async () => {
    signIn.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SignInPage />);
    await user.type(screen.getByLabelText("Email"), "a@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith("a@example.com", "secret123"));
    expect(replace).toHaveBeenCalledWith("/trips");
  });

  it("signs in with Google", async () => {
    signInWithGoogle.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SignInPage />);
    await user.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalled());
    expect(replace).toHaveBeenCalledWith("/trips");
  });

  it("links to the password reset page", () => {
    render(<SignInPage />);
    expect(screen.getByRole("link", { name: /forgot password/i })).toHaveAttribute(
      "href",
      "/reset-password",
    );
  });

  it("recovers from an existing-account collision by linking Google", async () => {
    const credential = { kind: "google" };
    signInWithGoogle.mockRejectedValue({
      code: "auth/account-exists-with-different-credential",
      credential,
      customData: { email: "ada@example.com" },
    });
    signIn.mockResolvedValue(undefined);
    accountMocks.linkPendingCredential.mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(<SignInPage />);
    await user.click(screen.getByRole("button", { name: /continue with google/i }));

    expect(await screen.findByLabelText("Email")).toHaveValue("ada@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /sign in and link google/i }));

    await waitFor(() =>
      expect(accountMocks.linkPendingCredential).toHaveBeenCalledWith(credential),
    );
    expect(replace).toHaveBeenCalledWith("/trips");
  });

  it("asks for a second factor when the account has one", async () => {
    const resolver = { hints: [] } as unknown as MultiFactorResolver;
    signIn.mockRejectedValue(new MfaRequiredError(resolver));
    const user = userEvent.setup();
    render(<SignInPage />);
    await user.type(screen.getByLabelText("Email"), "a@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(await screen.findByLabelText(/authentication code/i)).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("completes sign in with the second factor", async () => {
    const resolver = { hints: [] } as unknown as MultiFactorResolver;
    signIn.mockRejectedValue(new MfaRequiredError(resolver));
    resolveMfa.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SignInPage />);
    await user.type(screen.getByLabelText("Email"), "a@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await user.type(await screen.findByLabelText(/authentication code/i), "123456");
    await user.click(screen.getByRole("button", { name: /^verify$/i }));

    await waitFor(() => expect(resolveMfa).toHaveBeenCalledWith(resolver, "123456"));
    expect(replace).toHaveBeenCalledWith("/trips");
  });
});
