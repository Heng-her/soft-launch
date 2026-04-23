"use client";

import { useEffect, useState } from "react";

export default function HeroTitle() {
  const [showHeading, setShowHeading] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setShowHeading(true), 100);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <h1
      className={`text-3xl md:text-5xl whitespace-nowrap font-bold text-center text-white mb-6 uppercase drop-shadow-2xl transition-opacity duration-500 select-none ${
        showHeading ? "opacity-100" : "opacity-0"
      }`}
    >
      TOURISM IN CRISIS
    </h1>
  );
}
