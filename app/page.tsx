import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center animate-scale-up min-h-screen bg-black py-8">

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
  );
}
