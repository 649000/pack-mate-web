import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/data", () => ({
  getProfile: vi.fn(),
  upsertProfile: vi.fn(),
}));

const authState = vi.hoisted(() => ({
  user: {
    email: "ada@example.com",
    emailVerified: true,
    providerData: [{ providerId: "password" }],
  },
}));

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => ({ user: authState.user, loading: false }),
}));

vi.mock("@/lib/account", () => ({
  hasPasswordProvider: () => true,
  hasGoogleProvider: () => false,
  isMfaEnabled: () => false,
  changeEmail: vi.fn(),
  changePassword: vi.fn(),
  setPassword: vi.fn(),
  unlinkGoogle: vi.fn(),
  beginTotpEnrollment: vi.fn(),
  completeTotpEnrollment: vi.fn(),
  removeSecondFactor: vi.fn(),
  deleteAccount: vi.fn(),
  exportUserData: vi.fn(),
  downloadJson: vi.fn(),
  refreshUser: vi.fn(async () => ({ emailVerified: true })),
  sendVerificationEmail: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import * as data from "@/lib/data";
import { AccountView } from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AccountView", () => {
  it("renders the profile, account and data sections", async () => {
    vi.mocked(data.getProfile).mockResolvedValue(null);
    render(<AccountView />);

    expect(await screen.findByText(/personal info/i)).toBeInTheDocument();
    expect(screen.getByText(/data & privacy/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export data/i })).toBeInTheDocument();
  });

  it("shows empty profile fields for a new user", async () => {
    vi.mocked(data.getProfile).mockResolvedValue(null);
    render(<AccountView />);

    expect(await screen.findByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Birthday")).toHaveValue("");
  });

  it("offers to link Google when it is not linked", async () => {
    vi.mocked(data.getProfile).mockResolvedValue(null);
    render(<AccountView />);
    expect(await screen.findByRole("button", { name: /^link$/i })).toBeInTheDocument();
  });

  it("shows the account email and sign-in methods", async () => {
    vi.mocked(data.getProfile).mockResolvedValue(null);
    render(<AccountView />);

    expect(await screen.findByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText(/sign-in with google/i)).toBeInTheDocument();
    expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
  });

  it("shows the weight unit preference defaulting to kilograms", async () => {
    vi.mocked(data.getProfile).mockResolvedValue(null);
    render(<AccountView />);

    expect(await screen.findByLabelText("Weight unit")).toHaveTextContent(/kilogram/i);
  });

  it("reflects a saved pounds preference", async () => {
    vi.mocked(data.getProfile).mockResolvedValue({
      user_id: "u1",
      display_name: null,
      birthday: null,
      gender: null,
      weight_unit: "lb",
      theme: "light",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
    render(<AccountView />);

    await waitFor(() => expect(screen.getByLabelText("Weight unit")).toHaveTextContent(/pound/i));
  });
});
