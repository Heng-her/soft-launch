import Image from "next/image";
import Link from "next/link";
import HeroTitle from "./components/HeroTitle";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full opacity-20  object-cover -z-10 pointer-events-none"
      >
        <source src="/bg/home.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0  bg-[#003866] backdrop-blur-sm -z-30" />

      <main className="relative z-10 flex flex-col items-center justify-center md:mt-10 lg:mt-0 py-4 px-4 animate-scale-up">
        <div className="w-full max-w-6xl flex flex-col items-center justify-center mt-28">

          {/* Logos */}
          <div className="flex gap-4 items-center justify-center mb-4 md:mb-8">
            <div className="w-32 md:w-38 lg:w-38">
              <Image src="/STC_logo.svg" alt="STC" width={220} height={110} className="w-full h-auto object-contain" priority />
            </div>
            <div className="w-32 md:w-38 lg:w-38">
              <Image src="/48hr_logo.svg" alt="48hr" width={220} height={110} className="w-full h-auto object-contain" priority />
            </div>
          </div>

          {/* Improve */}
          <HeroTitle />

          <div className="text-center mb-6 max-w-2xl">
            <p className="text-sm md:text-xl lg:text-2xl text-white/90 leading-relaxed select-none">
              You are cordially invited to prevail the unsold rooms into <br className="hidden md:block" />
              the unforgettable stay by 48hr Hotel Booking
            </p>
          </div>

          <div className="w-full max-w-2xl flex items-center justify-between mb-8">

            {/* Left - Day */}
            <div className="flex-1 mr-2 border-t-2 border-b-2 border-[#FCCD03] py-2 md:py-4">
              <p className="text-[10px] sm:text-lg md:text-2xl lg:text-3xl font-semibold text-white text-center uppercase tracking-tighter md:tracking-widest select-none">
                Saturday
              </p>
            </div>

            {/* Center - Date */}
            <div className="flex flex-col items-center justify-center shrink-0 min-w-20 md:min-w-37.5 select-none">
              <p className="text-xs lg:text-md lg:-mb-5 md:text-sm tracking-[0.2em] md:tracking-[0.4em] text-white/90 uppercase">
                February
              </p>
              <h2 className="text-6xl sm:text-2xl md:text-6xl lg:text-9xl font-bold text-[#FCCD03] leading-none drop-shadow-lg">
                21
              </h2>
              <p className="text-xs sm:text-2xl text-white/90 md:text-xl tracking-[0.2em] md:tracking-[0.4em] uppercase">
                2026
              </p>
            </div>

            {/* Right - Time */}
            <div className="flex-1 border-t-2 border-b-2 border-[#FCCD03] py-2 md:py-4">
              <p className="text-[10px] sm:text-lg md:text-2xl lg:text-3xl font-semibold text-white text-center uppercase tracking-tighter md:tracking-widest select-none">
                6:00 PM
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <Link href="/adenda">
            <button className="btn relative overflow-hidden px-12 py-4 bg-[#FCCD03] text-black font-bold uppercase tracking-widest rounded-sm active:scale-95 select-none">
              <span className="relative z-10 pulse-text">View Agenda</span>
              <div className="absolute inset-0 bg-white/20 -translate-x-full transition-transform duration-500 skew-x-12"></div>
            </button>
          </Link>


        </div>
      </main>
    </div>
  );
}