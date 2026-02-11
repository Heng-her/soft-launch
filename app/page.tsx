import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* Background GIF */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          backgroundImage: "url('/bg/home.gif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Blue Overlay */}
      <div className="absolute inset-0 bg-[#0b3c66]/60 -z-10" />

      {/* Animated Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-8 animate-scale-up">

        {/* Image */}
        <div className="relative w-full max-w-5xl h-[50vh] md:h-[60vh] lg:h-[70vh] mb-10 sm:mb-6">
          <Image
            src="/1Desktop.png"
            alt="desktop"
            fill
            className="object-contain lg:block hidden"
            priority
          />
          <Image
            src="/1Mobile.png"
            alt="mobile"
            fill
            className="object-contain lg:hidden block"
            priority
          />
        </div>

        {/* Button */}
        <Link href="/adenda">
          <button className="btn">
            <span className="shine"></span>
            <span className="pulse-text">View Agenda</span>
          </button>
        </Link>
      </div>
    </div>

  );
}
