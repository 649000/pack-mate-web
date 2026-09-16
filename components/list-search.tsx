"use client";

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
