import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { LibraryPicker, type LibraryPickerOption } from "./library-picker";

const options: LibraryPickerOption[] = [
  { id: "i1", name: "Passport", detail: "Documents" },
  { id: "i2", name: "Travel adapter", detail: "Electronics" },
  { id: "i3", name: "Charger", detail: "Electronics" },
];

const label = "Add an item from your library";

function Harness({ options: initialOptions = options }: { options?: LibraryPickerOption[] }) {
  const [value, setValue] = useState("");
  return (
    <LibraryPicker
      id="picker"
      label={label}
      placeholder="Select an item"
      value={value}
      onChange={setValue}
      options={initialOptions}
      emptyMessage="No items in your library yet."
    />
  );
}

function trigger() {
  return screen.getByLabelText(label);
}

describe("LibraryPicker", () => {
  it("opens the list and shows the options", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(trigger()).toHaveTextContent("Select an item");

    await user.click(trigger());

    expect(await screen.findByRole("option", { name: /Passport/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Charger/ })).toBeInTheDocument();
  });

  it("matches part of a name anywhere in the name", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());

    await user.type(screen.getByLabelText("Search options"), "dapt");

    expect(screen.getByRole("option", { name: /Travel adapter/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Passport/ })).not.toBeInTheDocument();
  });

  it("ignores letter case when matching", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());

    await user.type(screen.getByLabelText("Search options"), "PASSPORT");

    expect(screen.getByRole("option", { name: /Passport/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Charger/ })).not.toBeInTheDocument();
  });

  it("restores the full list when the query is cleared", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());
    const input = screen.getByLabelText("Search options");

    await user.type(input, "pass");
    expect(screen.queryByRole("option", { name: /Charger/ })).not.toBeInTheDocument();

    await user.clear(input);

    expect(screen.getByRole("option", { name: /Passport/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Charger/ })).toBeInTheDocument();
  });

  it("reports the chosen option and shows it on the trigger", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());

    await user.click(await screen.findByRole("option", { name: /Passport/ }));

    expect(trigger()).toHaveTextContent("Passport");
    expect(screen.queryByLabelText("Search options")).not.toBeInTheDocument();
  });

  it("shows a no-match state naming the query", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());

    await user.type(screen.getByLabelText("Search options"), "tent");

    expect(screen.getByText(/no matches for .*tent/i)).toBeInTheDocument();
  });

  it("shows the empty-library state when there is nothing to choose", async () => {
    const user = userEvent.setup();
    render(<Harness options={[]} />);

    await user.click(trigger());

    expect(await screen.findByText(/no items in your library yet/i)).toBeInTheDocument();
  });

  it("moves through matches with the keyboard and confirms with Enter", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());
    const input = screen.getByLabelText("Search options");

    await user.type(input, "e");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(trigger()).toHaveTextContent("Charger");
  });

  it("dismisses without selecting on Escape", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());

    await user.type(screen.getByLabelText("Search options"), "pass");
    await user.keyboard("{Escape}");

    expect(screen.queryByLabelText("Search options")).not.toBeInTheDocument();
    expect(trigger()).toHaveTextContent("Select an item");
  });

  it("shows secondary detail so same-named entries are distinguishable", async () => {
    const duplicates: LibraryPickerOption[] = [
      { id: "a", name: "Charger", detail: "Electronics" },
      { id: "b", name: "Charger", detail: "Work & study" },
    ];
    const user = userEvent.setup();
    render(<Harness options={duplicates} />);

    await user.click(trigger());

    expect(await screen.findAllByRole("option", { name: /Charger/ })).toHaveLength(2);
    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Work & study")).toBeInTheDocument();
  });
});
