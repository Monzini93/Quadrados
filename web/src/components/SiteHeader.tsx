import Link from "next/link";
import { Scissors } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-zinc-100">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 shadow-lg shadow-amber-500/20">
            <Scissors className="h-5 w-5" />
          </span>
          Quadrados
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/agendar" className="rounded-full bg-amber-500 px-4 py-2 font-medium text-zinc-950 transition hover:bg-amber-400">
            Agendar
          </Link>
          <Link href="/admin/login" className="text-zinc-400 transition hover:text-zinc-200">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
