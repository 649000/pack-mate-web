const stats = [
  { value: "100%", label: "Of your packing list in one place" },
  { value: "1-tap", label: "Reuse items and bags from your library" },
  { value: "3", label: "Ways to pack: a bag, With Me, or loose" },
  { value: "0", label: "Bags required to get started" },
];

const Stats = () => {
  return (
    <section className="border-b border-border/60 bg-muted/40 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0">
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block font-mono text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">
                  {stat.value}
                </span>
                <span className="mt-2 block text-sm text-pretty text-muted-foreground">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};

export default Stats;
