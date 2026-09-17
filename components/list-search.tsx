"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ListSearch({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-end gap-2">
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </div>
      {value ? (
        <Button type="button" variant="outline" onClick={() => onChange("")}>
          Clear
        </Button>
      ) : null}
    </div>
  );
}

export function ListSearchEmpty({ noun, query }: { noun: string; query: string }) {
  return (
    <div className="p-10 text-center text-sm text-muted-foreground">
      No {noun} match &ldquo;{query}&rdquo;.
    </div>
  );
}

export function ListSearchToolbar({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        id={id}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full ps-8 pe-8 sm:w-56"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          mode="icon"
          size="sm"
          aria-label="Clear search"
          className="absolute end-1 top-1/2 -translate-y-1/2"
          onClick={() => onChange("")}
        >
          <X aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
