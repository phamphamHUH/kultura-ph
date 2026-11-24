"use client";

import React from "react";
import Image from "next/image";
import Nav from "./Nav";

export default function Header() {
  return (
    <div>
      <div>
        <div className="flex">
          <Image
            src="/ktr-ph-logo.png"
            alt="Kultura PH logo"
            width={40}
            height={40}
          />
          <div>
            <h1 className="font-bold tracking-widest">KULTURA PH</h1>
            <p className="text-xs font-light text-gray-600">
              Discover the Stories of the Philippines
            </p>
          </div>
        </div>
        <div></div>
      </div>
      <Nav />
    </div>
  );
}
