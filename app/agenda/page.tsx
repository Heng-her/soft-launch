"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Agenda() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute back-video right-0 opacity-20 bottom-0 min-w-full min-h-full w-auto h-auto inset-0 object-cover -z-10"
      >
        <source src="/bg/agenda.mp4" type="video/mp4" />
      </video>

      {/* Blue Overlay */}
      <div className="absolute inset-0 bg-[#002f55] -z-20" />

      {/* Back Button Top-Left */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center bg-white hover:bg-white/80 rounded-full shadow-lg transition-all duration-300 z-50" >
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
      <div className="relative -mt-10 lg:mt-0 z-10 flex gap-2 flex-col items-center justify-center min-h-screen animate-scale-up">
        <p className="text-xl lg:text-3xl uppercase font-semibold tracking-wide text-white select-none ">What&apos;s happening</p>
        <hr className="w-56 lg:w-72 border-t border-white/50 mb-6" />
        <div className="relative w-full max-w-6xl h-[50vh] md:h-[60vh] lg:h-[80vh] mb-10 sm:mb-6 select-none">
          <Image
            src="/3Desktop.png"
            alt="desktop"
            fill
            quality={75}
            draggable={false}
            className="sm:object-contain lg:block hidden pointer-events-none"
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
          />

          <Image
            src="/3Mobile.png"
            alt="desktop"
            fill
            quality={75}
            draggable={false}
            className="object-contain lg:hidden block pointer-events-none"
            priority
            sizes="100vw"
          />
        </div>
        <p className="text-center text-xs lg:text-xl w-72 lg:w-full text-white select-none">
          Note: The program schedule is subject to change or cancellation without prior notice
        </p>

      </div>
    </div>
  );
}
