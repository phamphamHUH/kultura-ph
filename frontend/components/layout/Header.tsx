"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import Nav from "./Nav";

type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

function SearchBox({ value, onChange, className = "" }: SearchBoxProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        size={17}
        strokeWidth={1.5}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-800"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search places, stories, traditions..."
        aria-label="Search"
        className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-800 md:h-9 md:text-xs"
      />
    </div>
  );
}

export default function Header() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-10">
      {/* Top row: logo + (search on tablet/desktop | hamburger on mobile) */}
      <div className="flex items-center justify-between gap-4 py-4 md:pb-5 md:pt-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image
            src="/ktr-ph-logo.png"
            alt="Kultura PH logo"
            width={24}
            height={46}
            priority
            className="h-10 w-auto shrink-0 object-contain sm:h-11"
          />
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-widest">KULTURA PH</h1>
            <p className="hidden text-xs font-light text-gray-600 sm:block">
              Discover the Stories of the Philippines
            </p>
          </div>
        </Link>

        {/* Tablet and up: inline search */}
        <SearchBox
          value={search}
          onChange={setSearch}
          className="hidden md:flex md:w-64 lg:w-80"
        />

        {/* Mobile only: hamburger button */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gray-300 text-gray-700 transition hover:bg-gray-50 md:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Tablet and up: horizontal tabs */}
      <div className="hidden md:block">
        <Nav variant="tabs" />
      </div>

      {/* Mobile only: dropdown panel */}
      {open && (
        <div
          id="mobile-menu"
          className="flex flex-col gap-4 border-t border-gray-200 py-4 md:hidden"
        >
          <SearchBox value={search} onChange={setSearch} />
          <Nav variant="stack" onNavigate={() => setOpen(false)} />
        </div>
      )}
    </header>
  );
}
