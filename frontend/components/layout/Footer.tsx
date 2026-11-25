import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white px-4 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-6 py-8 md:flex-row md:items-start md:justify-between md:gap-10">
        {/* Brand */}
        <Link href="/" className="flex min-w-0 justify-center flex-col gap-3">
          <div className="flex gap-3 items-center">
            <Image
              src="/ktr-ph-logo.png"
              alt="Kultura PH logo"
              width={24}
              height={46}
              className="h-9 w-auto shrink-0 object-contain sm:h-10"
            />
            <p className="font-bold tracking-widest text-blue-800">
              KULTURA PH
            </p>
          </div>
          <p className="text-xs font-light text-gray-400">
            A starting point for deeper understanding.
          </p>
          <div className="flex gap-1">
            <div className="w-5 h-2 border-b-3 border-blue-800"></div>
            <div className="w-5 border-b-3 border-red-800"></div>
            <div className="w-5 border-b-3 border-yellow-400"></div>
          </div>
        </Link>

        {/* Note + copyright */}
        <div className="flex max-w-md flex-col gap-2 text-xs text-gray-400 md:text-left">
          <p>
            No single profile can represent a whole people. Keep learning from
            communities and cultural institutions.
          </p>
          <p>© 2026 Kultura PH · Culture is always in motion.</p>
        </div>
      </div>
    </footer>
  );
}
