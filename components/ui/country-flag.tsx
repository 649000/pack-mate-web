import { Globe } from "lucide-react";
import { countryFlagUrl } from "@/lib/country-flag";
import { cn } from "@/lib/utils";

// Renders a country's flag from the vendored SVG set, or a neutral globe when
// the code is unknown. Always decorative: callers show the country name as text.
export function CountryFlag({
  code,
  className,
}: {
  code: string | null | undefined;
  className?: string;
}) {
  const url = countryFlagUrl(code);
  if (!url) {
    return (
      <Globe
        className={cn("size-3.5 shrink-0 text-muted-foreground", className)}
        aria-hidden="true"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static public asset
    <img
      src={url}
      alt=""
      aria-hidden="true"
      width={20}
      height={15}
      loading="lazy"
      className={cn(
        "inline-block h-3.5 w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-border",
        className,
      )}
    />
  );
}
