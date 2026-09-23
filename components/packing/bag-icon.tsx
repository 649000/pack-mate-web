import { BAG_ICONS, resolveBagIconKey } from "@/lib/bag-icons";
import { cn } from "@/lib/utils";
import type { ItemCategory } from "@/lib/types";

// Decorative: the bag name always accompanies this icon, so it is hidden from
// assistive technology.
export function BagIcon({
  icon,
  categories = [],
  className,
}: {
  icon: string | null | undefined;
  categories?: readonly (ItemCategory | null)[];
  className?: string;
}) {
  const Icon = BAG_ICONS[resolveBagIconKey(icon, categories)];
  return <Icon className={cn("size-4", className)} aria-hidden="true" />;
}
