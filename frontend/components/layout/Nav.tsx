"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAVIGATIONS = [
  { label: "Explore Map", href: "/" },
  { label: "Celebrate Festivals", href: "/festivals" },
  { label: "Embrace Heritage", href: "/heritage" },
  { label: "About KTR PH", href: "/about" },
];

type NavProps = {
  /** "tabs" = horizontal underline tabs (tablet/desktop)
   *  "stack" = vertical list (mobile menu) */
  variant?: "tabs" | "stack";
  /** Called when a link is clicked, e.g. to close the mobile menu */
  onNavigate?: () => void;
};

export default function Nav({ variant = "tabs", onNavigate }: NavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/" || pathname.startsWith("/regions")
      : pathname.startsWith(href);

  if (variant === "stack") {
    return (
      <nav aria-label="Main" className="flex flex-col gap-1">
        {NAVIGATIONS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`rounded-md px-3 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Main" className="flex gap-6 overflow-x-auto lg:gap-8">
      {NAVIGATIONS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap border-b-2 py-4 text-sm font-medium transition-colors ${
              active
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
