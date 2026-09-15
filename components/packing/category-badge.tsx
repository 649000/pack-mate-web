import { Badge } from "@/components/ui/badge";
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
    <Badge variant="secondary" size="sm" className={className}>
      {ITEM_CATEGORY_LABELS[category]}
    </Badge>
  );
}
