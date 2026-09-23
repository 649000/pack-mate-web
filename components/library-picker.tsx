"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check } from "lucide-react";
import { CategoryIcon } from "@/components/packing/category-icon";
import { Button, ButtonArrow } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { filterByName } from "@/lib/packing";
import { cn } from "@/lib/utils";
import type { ItemCategory } from "@/lib/types";

export type LibraryPickerOption = {
  id: string;
  name: string;
  detail?: string;
  category?: ItemCategory | null;
};

const MAX_MATCHES = 50;

export function LibraryPicker({
  id,
  label,
  placeholder,
  value,
  onChange,
  options,
  emptyMessage,
  className,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (id: string) => void;
  options: LibraryPickerOption[];
  emptyMessage: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(
    () => filterByName(options, query).slice(0, MAX_MATCHES),
    [options, query],
  );
  const selected = options.find((option) => option.id === value) ?? null;
  const activeOption = matches[activeIndex];

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const active = listRef.current?.querySelector('[data-active="true"]');
    if (active && typeof active.scrollIntoView === "function") {
      active.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, open]);

  function close() {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }

  function select(option: LibraryPickerOption) {
    onChange(option.id);
    close();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, matches.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeOption) select(activeOption);
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setOpen(true);
        else close();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          mode="input"
          placeholder={selected === null}
          aria-label={label}
          className={cn("w-full", className)}
        >
          <span className="truncate">{selected?.name ?? placeholder}</span>
          <ButtonArrow />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {options.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <>
            <div className="border-b border-border p-2">
              <Input
                ref={inputRef}
                role="combobox"
                aria-label="Search options"
                aria-expanded
                aria-controls={`${id}-listbox`}
                aria-autocomplete="list"
                aria-activedescendant={activeOption ? `${id}-option-${activeOption.id}` : undefined}
                placeholder="Type to search..."
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div
              ref={listRef}
              id={`${id}-listbox`}
              role="listbox"
              aria-label={label}
              className="max-h-60 overflow-y-auto p-1"
            >
              {matches.length === 0 ? (
                <p className="p-3 text-center text-sm text-muted-foreground">
                  No matches for &ldquo;{query}&rdquo;.
                </p>
              ) : (
                matches.map((option, index) => (
                  <button
                    key={option.id}
                    id={`${id}-option-${option.id}`}
                    type="button"
                    role="option"
                    aria-selected={option.id === value}
                    data-active={index === activeIndex}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm",
                      index === activeIndex && "bg-accent",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => select(option)}
                  >
                    {option.category !== undefined ? (
                      <CategoryIcon
                        category={option.category}
                        className="size-4 text-muted-foreground"
                      />
                    ) : null}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{option.name}</span>
                      {option.detail ? (
                        <span className="truncate text-xs text-muted-foreground">
                          {option.detail}
                        </span>
                      ) : null}
                    </span>
                    {option.id === value ? <Check className="size-4 shrink-0 opacity-60" /> : null}
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
