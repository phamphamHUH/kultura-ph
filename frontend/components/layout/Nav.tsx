import Link from "next/link";
import { usePathname } from "next/navigation";

const NAVIGATIONS = [
  { label: "Explore Map", href: "/" },
  { label: "Celebrate Festivals", href: "/festivals" },
  { label: "Embrace Heritage", href: "/heritage" },
  { label: "About KTR PH", href: "/about" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-8 overflow-x-auto border-b border-gray-200 px-6">
      {NAVIGATIONS.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/" || pathname.startsWith("/regions")
            : pathname.startsWith(item.href);

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
