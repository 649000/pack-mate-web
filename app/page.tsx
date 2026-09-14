import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center px-4 py-4">
        <span className="font-semibold tracking-tight">Pack Mate</span>
        <Button asChild variant="ghost" size="sm" className="ms-auto">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          Know what you are bringing, and where it is.
        </h1>
        <p className="max-w-md text-muted-foreground">
          Build reusable bags and items once, then pack them into a list for any trip. Mark what is
          in a bag, what is With Me, and what is already packed.
        </p>
        <Button asChild size="lg">
          <Link href="/sign-in">Get started</Link>
        </Button>
      </main>
      <footer className="mx-auto w-full max-w-3xl px-4 py-6 text-center text-xs text-muted-foreground">
        Pack Mate
      </footer>
    </div>
  );
}
