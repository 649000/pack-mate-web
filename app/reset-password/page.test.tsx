import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const accountMocks = vi.hoisted(() => ({ sendPasswordReset: vi.fn() }));

vi.mock("@/lib/account", () => ({
  sendPasswordReset: accountMocks.sendPasswordReset,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import ResetPasswordPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ResetPasswordPage", () => {
  it("renders the reset form with a link back to sign in", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to sign in/i })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  it("sends a reset link for a valid address", async () => {
    accountMocks.sendPasswordReset.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ResetPasswordPage />);
    await user.type(screen.getByLabelText("Email"), "a@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() =>
      expect(accountMocks.sendPasswordReset).toHaveBeenCalledWith("a@example.com"),
    );
  });
});
