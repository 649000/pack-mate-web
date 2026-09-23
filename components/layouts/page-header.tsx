import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function PageHeader({
  title,
  titleAddon,
  meta,
  description,
  breadcrumb,
  children,
}: {
  title: string;
  titleAddon?: ReactNode;
  meta?: ReactNode;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
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
                  {!last && <ChevronRight className="size-3 text-muted-foreground" />}
                </span>
              );
            })}
          </div>
        )}
        <h1 className="flex items-center gap-2 font-heading text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-3xl">
          {titleAddon}
          {title}
        </h1>
        {meta ? <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">{meta}</div> : null}
        {description && (
          <p className="max-w-2xl text-sm font-normal text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
    </div>
  );
}
