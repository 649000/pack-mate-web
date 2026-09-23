import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WeightByCategoryChart } from "./weight-by-category-chart";
import type { CategoryWeight } from "@/lib/weight";

const rows: CategoryWeight[] = [
  { category: "clothing", grams: 1000, complete: true },
  { category: "electronics", grams: 500, complete: true },
  { category: null, grams: 200, complete: false },
];

describe("WeightByCategoryChart", () => {
  it("renders a labelled bar and formatted weight per category", () => {
    const { container } = render(<WeightByCategoryChart rows={rows} unit="kg" />);
    const view = within(container);

    expect(view.getByText("Clothing")).toBeInTheDocument();
    expect(view.getByText("Electronics")).toBeInTheDocument();
    expect(view.getByText("Uncategorised")).toBeInTheDocument();
    expect(view.getByText("1.00 kg")).toBeInTheDocument();
    expect(view.getByText("0.50 kg")).toBeInTheDocument();
    expect(view.getByText("0.20 kg")).toBeInTheDocument();
    expect(view.getByText(/grey bars include items with no weight/i)).toBeInTheDocument();
  });

  it("shows a message when there is nothing to chart", () => {
    render(<WeightByCategoryChart rows={[]} unit="kg" />);

    expect(screen.getByText(/no weights yet/i)).toBeInTheDocument();
  });
});
