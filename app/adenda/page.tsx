"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Agenda() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* Background GIF */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          backgroundImage: "url('/bg/adenda.gif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Blue Overlay */}
      <div className="absolute inset-0 bg-[#0b3c66]/70 -z-10" />

      {/* Back Button Top-Left */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center
                 bg-white hover:bg-white/80 rounded-full shadow-lg
                 transition-all duration-300 z-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 text-[#095693]"
        >
          <path
            fillRule="evenodd"
            d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Page Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-8">
        <div className="relative w-full max-w-5xl h-[50vh] md:h-[60vh] lg:h-[70vh] mb-10 sm:mb-6">
          <Image
            src="/2Desktop.png"
            alt="desktop"
            fill
            className="object-contain lg:block hidden"
            priority
          />
          <Image
            src="/2Mobile.png"
            alt="mobile"
            fill
            className="object-contain lg:hidden block"
            priority
          />
        </div>
      </div>

    </div>
  );

}
