import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  children,
}: {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-5 pb-7.5">
      <div className="flex flex-col justify-center gap-2">
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground lg:text-sm">
            {breadcrumb.map((item, index) => {
              const last = index === breadcrumb.length - 1;
              return (
                <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                  {item.href && !last ? (
                    <Link href={item.href} className="hover:text-primary">
                      {item.label}
                    </Link>
                  ) : (
                    <span className={last ? "text-foreground" : undefined}>{item.label}</span>
                  )}
                  {!last && <ChevronRight className="size-3.5 text-muted-foreground" />}
                </span>
              );
            })}
          </div>
        )}
        <h1 className="text-xl leading-none font-medium text-foreground">{title}</h1>
        {description && (
          <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
            {description}
          </div>
        )}
      </div>
      {children && <div className="flex items-center gap-2.5">{children}</div>}
    </div>
  );
}
