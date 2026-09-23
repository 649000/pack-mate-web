import { cn } from "@/lib/utils";

export function CustomSubtitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mx-auto max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg",
        className,
      )}
    >
      {children}
    </p>
  );
}
