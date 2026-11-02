'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname.startsWith('/staff')) return null;
  return <header className="absolute z-20 w-full border-b border-white/20 text-white">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 lg:px-10">
      <Link href="/" className="focus-ring flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center border border-white/70 text-sm font-bold">E</span>
        <span className="truncate text-sm font-bold tracking-[.18em] sm:tracking-[.24em]">ESTATESTAY</span>
      </Link>
      <nav className="hidden items-center gap-8 text-xs tracking-[.1em] md:flex">
        <Link href="/rooms" className="hover:opacity-70">STAYS</Link>
        <a href="/#experiences" className="hover:opacity-70">EXPERIENCES</a>
        <a href="/#estate" className="hover:opacity-70">THE ESTATE</a>
        <Link href="/staff" className="flex items-center gap-1 border-l border-white/30 pl-8 hover:opacity-70">STAFF LOGIN <ArrowUpRight size={13}/></Link>
      </nav>
      <Link href="/rooms" className="shrink-0 border border-white px-3 py-2 text-[9px] font-bold tracking-[.12em] transition hover:bg-white hover:text-forest sm:px-4 sm:text-[10px] sm:tracking-[.16em]">BOOK A STAY</Link>
    </div>
  </header>;
}
