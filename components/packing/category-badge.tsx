import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/packing/category-icon";
import { ITEM_CATEGORY_LABELS } from "@/lib/validation";
import type { ItemCategory } from "@/lib/types";

export function CategoryBadge({
  category,
  className,
}: {
  category: ItemCategory | null;
  className?: string;
}) {
  if (category === null) return null;
  return (
    <Badge
      variant="secondary"
      size="sm"
      className={`gap-1 rounded-full font-medium tracking-wide ${className ?? ""}`}
    >
      <CategoryIcon category={category} className="size-3" />
      {ITEM_CATEGORY_LABELS[category]}
    </Badge>
  );
}
