import Image from "next/image";
import Link from "next/link";
import HeroTitle from "./components/HeroTitle";

export default function Home() {
  console.log("Home");
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full opacity-20 object-cover -z-20 pointer-events-none"
      >
        <source src="/bg/home.mp4" type="video/mp4" />
      </video>
      <Image
        src="/bg/home.png"
        alt="Background"
        fill
        className="object-cover -z-10 pointer-events-none"
        priority
      />
      <div className="absolute inset-0  bg-[#002f55] backdrop-blur-sm -z-30" />

      <main className="relative z-10 flex flex-col items-center justify-center md:mt-10 lg:mt-0 py-4 px-4 animate-scale-up">
        <div className="w-full max-w-6xl flex flex-col items-center justify-center mt-10">
          {/* Logos */}
          <div className="flex gap-4 items-center justify-center mb-4 md:mb-8">
            <div className="w-36 md:w-38 lg:w-38">
              <Image
                src="/STC_logo.svg"
                alt="STC"
                width={220}
                height={110}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
            <div className="w-48 md:w-48 lg:w-56">
              <Image
                src="/nita_by_vo.png"
                alt="Nita By Vo"
                width={280}
                height={180}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>

          {/* Improve */}
          <HeroTitle />

          <div className="text-center mb-6 max-w-2xl">
            <p className="text-sm md:text-xl lg:text-2xl text-white leading-relaxed select-none">
              You are cordially invited to join the networking event <br />
              “Tourism In Crisis”
            </p>
          </div>

          <div className="w-full max-w-3xl flex items-center justify-between mb-8">
            {/* Left - Day */}
            <div className="flex-1 mr-2 border-t-2 border-b-2 border-[#FFA580] py-2 md:py-4">
              <p className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-medium text-white text-center uppercase tracking-wide select-none">
                Saturday
              </p>
            </div>

            {/* Center - Date */}
            <div className="flex flex-col items-center justify-center text-center shrink-0 min-w-20 md:min-w-37.5 select-none">
              <p className="text-sm lg:text-md lg:-mb-5 md:text-sm tracking-[0.2em] md:tracking-[0.4em] text-white uppercase text-center">
                May
              </p>
              <h2 className="text-6xl sm:text-2xl md:text-6xl pb-2 lg:text-9xl font-bold text-[#FFA580] leading-none drop-shadow-lg text-center">
                16
              </h2>
              <p className="text-sm sm:text-2xl text-white md:text-xl tracking-[0.2em] md:tracking-[0.4em] uppercase text-center mr-1">
                2026
              </p>
            </div>

            {/* Right - Time */}
            <div className="flex-1 border-t-2 border-b-2 border-[#FFA580] py-2 md:py-4 text-center">
              <p className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-medium text-white text-center uppercase tracking-wide select-none">
                5:00 PM - 10:00 PM
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white leading-relaxed select-none text-center mb-8 uppercase tracking-widest">
            Nita by Vo, roof top
          </p>
          {/* CTA Button */}
          <div className="flex flex-col items-center justify-center gap-y-4 w-full max-w-210">
            <Link href="/agenda" className="w-full">
              <button className="btn-2 w-full py-3.5 overflow-hidden font-semibold uppercase tracking-widest select-none">
                <span className="relative z-10 pulse-text-two">
                  View Agenda
                </span>
                <div className="absolute inset-0 bg-white/20 -translate-x-full transition-transform duration-500 skew-x-12"></div>
              </button>
            </Link>
            <Link href="/register" className="w-full">
              <button className="btn relative w-full py-3.5 overflow-hidden font-semibold uppercase tracking-widest select-none">
                <span className="relative z-10 pulse-text">
                  ACCEPT JOIN THE EVENT
                </span>
                <div className="absolute inset-0 bg-[#0F74BC]/20 -translate-x-full transition-transform duration-500 skew-x-12"></div>
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
