import Link from "next/link";
import { MainNav } from "@/components/main-nav";
import { Separator } from "@/components/ui/separator";

export function AppHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Sim EHR
          <span className="text-muted-foreground font-normal"> · Prototype Alpha</span>
        </Link>
        <MainNav />
      </div>
      <Separator />
    </header>
  );
}
