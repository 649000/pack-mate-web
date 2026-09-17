import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { DataGrid } from "./data-grid";
import { DataGridTable } from "./data-grid-table";
import { DataGridColumnHeader } from "./data-grid-column-header";
import { DataGridPagination } from "./data-grid-pagination";
import { DataGridColumnVisibility } from "./data-grid-column-visibility";
import { Button } from "./button";
import { Skeleton } from "./skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";

interface SampleItem {
  id: string;
  name: string;
  category: string;
  weightGrams: number | null;
}

const items: SampleItem[] = [
  { id: "1", name: "Passport", category: "documents", weightGrams: 50 },
  { id: "2", name: "Charger", category: "electronics", weightGrams: 200 },
  { id: "3", name: "Towel", category: "clothing", weightGrams: null },
];

function DataGridHarness() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<SampleItem>[] = [
    {
      accessorKey: "name",
      id: "name",
      meta: { headerTitle: "Name" },
      header: ({ column }) => <DataGridColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <span>{row.original.name}</span>,
    },
    {
      accessorKey: "category",
      id: "category",
      meta: { headerTitle: "Category" },
      header: ({ column }) => <DataGridColumnHeader column={column} title="Category" />,
      cell: ({ row }) => <span>{row.original.category}</span>,
    },
    {
      accessorKey: "weightGrams",
      id: "weightGrams",
      meta: { headerTitle: "Weight" },
      header: ({ column }) => <DataGridColumnHeader column={column} title="Weight" />,
      cell: ({ row }) => <span>{row.original.weightGrams ?? 0}</span>,
    },
  ];

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <DataGrid table={table} recordCount={items.length}>
      <DataGridTable />
    </DataGrid>
  );
}

describe("ported theme components", () => {
  it("renders data grid rows and columns against sample data", () => {
    render(<DataGridHarness />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Passport")).toBeInTheDocument();
    expect(screen.getByText("Charger")).toBeInTheDocument();
    expect(screen.getByText("Towel")).toBeInTheDocument();
  });

  it("sorts rows when a sortable column header is activated", async () => {
    const user = userEvent.setup();
    render(<DataGridHarness />);

    await user.click(screen.getByText("Name"));

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("Charger");
    expect(rows[2]).toHaveTextContent("Towel");
  });

  it("renders pagination and column visibility controls", () => {
    function ControlsHarness() {
      const table = useReactTable({
        data: items,
        columns: [
          {
            accessorKey: "name",
            id: "name",
            meta: { headerTitle: "Name" },
            header: ({ column }) => <DataGridColumnHeader column={column} title="Name" />,
            cell: ({ row }) => <span>{row.original.name}</span>,
          },
        ] as ColumnDef<SampleItem>[],
        getCoreRowModel: getCoreRowModel(),
      });
      return (
        <DataGrid
          table={table}
          recordCount={items.length}
          tableLayout={{ columnsVisibility: true }}
        >
          <DataGridColumnVisibility
            table={table}
            trigger={
              <Button variant="outline" size="sm">
                Columns
              </Button>
            }
          />
          <DataGridTable />
          <DataGridPagination />
        </DataGrid>
      );
    }

    render(<ControlsHarness />);

    expect(screen.getByRole("button", { name: /columns/i })).toBeInTheDocument();
    expect(screen.getByText("Passport")).toBeInTheDocument();
  });

  it("switches between tabs", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="bags">
        <TabsList>
          <TabsTrigger value="bags">Bags</TabsTrigger>
          <TabsTrigger value="with-me">With Me</TabsTrigger>
        </TabsList>
        <TabsContent value="bags">Backpack contents</TabsContent>
        <TabsContent value="with-me">Passport and wallet</TabsContent>
      </Tabs>,
    );

    expect(screen.getByText("Backpack contents")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "With Me" }));

    expect(screen.getByText("Passport and wallet")).toBeInTheDocument();
  });

  it("renders a breadcrumb trail", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/trips">Trips</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Japan</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );

    expect(screen.getByText("Trips")).toBeInTheDocument();
    expect(screen.getByText("Japan")).toBeInTheDocument();
  });

  it("renders a skeleton placeholder", () => {
    const { container } = render(<Skeleton data-testid="skeleton" />);
    expect(container.querySelector('[data-testid="skeleton"]')).toBeInTheDocument();
  });

  it("renders a tooltip trigger with an accessible name", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger aria-label="Delete trip">Delete</TooltipTrigger>
          <TooltipContent>Delete this trip</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    expect(screen.getByRole("button", { name: "Delete trip" })).toBeInTheDocument();
  });
});
