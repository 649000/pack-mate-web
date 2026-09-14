import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const signIn = vi.fn();
const signUp = vi.fn();
const signInWithGoogle = vi.fn();

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
    signOut: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

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
});
