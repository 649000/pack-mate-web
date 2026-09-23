export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="container">
        <div className="flex flex-col items-center gap-3 py-5 md:flex-row md:justify-between">
          <nav className="flex order-1 gap-4 text-sm text-muted-foreground md:order-2">
            <span>Simple packing lists for every trip.</span>
          </nav>
          <div className="order-2 flex gap-2 text-sm font-normal md:order-1">
            <span className="text-muted-foreground">{currentYear} &copy;</span>
            <span className="text-foreground">Pack Mate</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
