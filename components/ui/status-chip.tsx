import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusChipVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] leading-4 font-semibold tracking-wide uppercase [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      status: {
        packed: "bg-packed-soft text-packed-soft-foreground",
        withMe: "bg-with-me-soft text-with-me-soft-foreground",
        pending: "bg-pending-soft text-pending-soft-foreground",
        warning: "bg-warning-soft text-warning-soft-foreground",
        neutral: "bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: {
      status: "neutral",
    },
  },
);

export function StatusChip({
  status,
  className,
  children,
}: { className?: string; children?: React.ReactNode } & VariantProps<typeof statusChipVariants>) {
  return (
    <span data-slot="status-chip" className={cn(statusChipVariants({ status }), className)}>
      {children}
    </span>
  );
}
