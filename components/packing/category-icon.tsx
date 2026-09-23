import { CATEGORY_ICONS, CATEGORY_ICON_FALLBACK } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import type { ItemCategory } from "@/lib/types";

// Decorative: the category label always accompanies this icon, so it is hidden
// from assistive technology.
export function CategoryIcon({
  category,
  className,
}: {
  category: ItemCategory | null;
  className?: string;
}) {
  const Icon = category === null ? CATEGORY_ICON_FALLBACK : CATEGORY_ICONS[category];
  return <Icon className={cn("size-3.5 shrink-0", className)} aria-hidden="true" />;
}
