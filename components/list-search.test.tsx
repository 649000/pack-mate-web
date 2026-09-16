import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { filterByName } from "@/lib/packing";
import { ListSearch, ListSearchEmpty } from "./list-search";

const entries = [
  { id: "a", name: "Passport" },
  { id: "b", name: "Charger" },
];

function Harness() {
  const [query, setQuery] = useState("");
  const visible = filterByName(entries, query);
  return (
    <div>
      <ListSearch id="list-search" label="Search" value={query} onChange={setQuery} />
      {visible.length === 0 ? (
        <ListSearchEmpty noun="things" query={query} />
      ) : (
        <ul>
          {visible.map((entry) => (
            <li key={entry.id}>{entry.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

describe("ListSearch", () => {
  it("filters the rendered entries as the user types", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("Search"), "pass");

    expect(screen.getByText("Passport")).toBeInTheDocument();
    expect(screen.queryByText("Charger")).not.toBeInTheDocument();
  });

  it("restores the full list when cleared", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("Search"), "pass");
    await user.click(screen.getByRole("button", { name: /clear/i }));

    expect(screen.getByText("Passport")).toBeInTheDocument();
    expect(screen.getByText("Charger")).toBeInTheDocument();
  });

  it("names the query in the empty state", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("Search"), "tent");

    expect(screen.getByText(/no things match .*tent/i)).toBeInTheDocument();
  });
});
