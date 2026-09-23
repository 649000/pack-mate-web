import { cn } from "@/lib/utils";

export function CustomTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "font-heading text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl",
        className,
      )}
    >
      {children}
    </h2>
  );
}
