"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Clock, Coins, Globe, Phone, Plug } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getDestinationFacts } from "@/lib/data";
import { currencySymbol, referenceDate, resolveTimeZones } from "@/lib/destination-facts";
import type { DestinationFacts } from "@/lib/types";

// Plug images are original schematic diagrams under public/plugs, one per IEC
// plug type letter, drawn by the project (no third-party licensing).
function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Globe;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}

function PowerValue({ facts }: { facts: DestinationFacts }) {
  const rating = [
    facts.voltage === null ? null : `${facts.voltage} V`,
    facts.frequency === null ? null : `${facts.frequency} Hz`,
  ]
    .filter((part): part is string => part !== null)
    .join(" · ");

  return (
    <div className="flex flex-col gap-1">
      {facts.plug_types.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {facts.plug_types.map((type) => (
            <span key={type} className="flex items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element -- static public asset */}
              <img
                src={`/plugs/${type}.svg`}
                alt={`Type ${type} plug`}
                width={24}
                height={24}
                className="size-6"
              />
              <span>Type {type}</span>
            </span>
          ))}
        </div>
      ) : null}
      {rating ? <span className="text-muted-foreground">{rating}</span> : null}
    </div>
  );
}

export function DestinationInfo({
  countryCode,
  destination,
  startDate,
}: {
  countryCode: string;
  destination: string | null;
  startDate: string | null;
}) {
  const [loaded, setLoaded] = useState<{
    countryCode: string;
    facts: DestinationFacts | null;
  } | null>(null);

  useEffect(() => {
    let active = true;
    getDestinationFacts(countryCode)
      .then((next) => {
        if (active) setLoaded({ countryCode, facts: next });
      })
      .catch(() => {
        if (active) setLoaded({ countryCode, facts: null });
      });
    return () => {
      active = false;
    };
  }, [countryCode]);

  const facts = loaded?.countryCode === countryCode ? loaded.facts : null;
  if (!facts) return null;

  const symbol = currencySymbol(facts.currency_code);
  const currency = [facts.currency_code, symbol].filter(Boolean).join(" ");
  const timeZones = resolveTimeZones({
    facts,
    destination,
    at: referenceDate(startDate),
  });

  const hasContent =
    facts.plug_types.length > 0 ||
    facts.voltage !== null ||
    facts.frequency !== null ||
    currency.length > 0 ||
    facts.calling_code !== null ||
    timeZones.length > 0;

  if (!hasContent) return null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Globe className="size-4 text-muted-foreground" aria-hidden="true" />
          Destination info
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {facts.plug_types.length > 0 || facts.voltage !== null || facts.frequency !== null ? (
            <Field icon={Plug} label="Power">
              <PowerValue facts={facts} />
            </Field>
          ) : null}
          {currency ? (
            <Field icon={Coins} label="Currency">
              {currency}
            </Field>
          ) : null}
          {facts.calling_code ? (
            <Field icon={Phone} label="Calling code">
              {facts.calling_code}
            </Field>
          ) : null}
          {timeZones.length > 0 ? (
            <Field icon={Clock} label={timeZones.length > 1 ? "Time zones" : "Time zone"}>
              <ul className="flex flex-col gap-0.5">
                {timeZones.map((zone) => (
                  <li key={zone.zone}>
                    {zone.city} {zone.localTime} · {zone.differenceLabel}
                  </li>
                ))}
              </ul>
            </Field>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
