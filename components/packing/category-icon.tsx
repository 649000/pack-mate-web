import { CATEGORY_ICONS, CATEGORY_ICON_FALLBACK } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import type { ItemCategory } from "@/lib/types";

// Decorative: the category label always accompanies this icon, so it is hidden
// from assistive technology.
export function CategoryIcon({
  category,
  className,
}: {
  category: ItemCategory | null | undefined;
  className?: string;
}) {
  const Icon = category ? CATEGORY_ICONS[category] : CATEGORY_ICON_FALLBACK;
  return <Icon className={cn("size-3.5 shrink-0", className)} aria-hidden="true" />;
}
