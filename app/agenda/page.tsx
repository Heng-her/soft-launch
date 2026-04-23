"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

const agendaData = [
  { time: "5:00PM-5:50PM", program: "Arrival of guests" },
  {
    time: "5:50PM-6:30PM",
    program: "Opening Speech by Siem Reap Tourism Club Association (STC).",
  },
  {
    time: "6:30PM-6:50PM",
    program: "Welcome Speech by Nita By Vo Luxury Hotel",
  },
  { time: "6:50PM-7:30PM", program: "Speech by Deputy Governor" },
  { time: "7:30PM-8:30PM", program: "Panellist" },
  {
    time: "8:30PM-10:00PM",
    program: "Wine Cocktail and Canapé with Live Band",
  },
];

export default function Agenda() {
  const router = useRouter();
  const handleBack = () => {
    try {
      router.push("/");
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <Image
        src="/bg/agenda.png"
        alt="Background"
        fill
        className="-z-10 pointer-events-none"
        priority
      />

      {/* Blue Overlay */}
      <div className="absolute inset-0 bg-[#002f55] -z-20" />

      {/* Back Button Top-Left */}
      <button
        onClick={() => handleBack()}
        className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center bg-white hover:bg-white/80 rounded-full shadow-lg transition-all duration-300 z-50"
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
      <div className="relative lg:mt-0 z-10 flex gap-2 flex-col items-center justify-center min-h-screen animate-scale-up px-4 text-center">
        <p className="text-3xl lg:text-4xl uppercase font-bold tracking-wide text-white select-none">
          Agenda
        </p>
        <p className="text-sm uppercase md:text-base lg:text-[16.5px] text-white w-full max-w-4xl mt-2 select-none leading-relaxed">
          Tourism in Crisis A Networking event for tourism professionals.
          Connecting Minds and Sharping
          <br className="hidden lg:block" />
          the future of tourism and travel. On May 16th 2026 at 5:00PM until
          10:00PM Place Nita by VO.
        </p>

        <div className="w-full max-w-4xl mx-auto my-8 overflow-hidden rounded-xl border border-white/30 bg-[#28608a]/20 backdrop-blur-sm shadow-xl">
          <table className="w-full text-left text-white border-collapse">
            <thead>
              <tr className="bg-[#C88A62] text-white">
                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold w-[35%] md:w-1/3 border-r border-white/30">
                  Time
                </th>
                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold w-[65%] md:w-2/3">
                  Program
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/30 text-sm md:text-base font-light">
              {agendaData.map((item, index) => (
                <tr key={index} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 font-normal py-3 md:px-6 md:py-4 border-r border-white/30 whitespace-nowrap">
                    {item.time}
                  </td>
                  <td className="px-4 py-3 md:px-6 md:py-4">{item.program}</td>
                </tr>
              ))}
              <tr className="bg-white/10 hover:bg-white/20 transition-colors">
                <td
                  colSpan={2}
                  className="px-4 py-3 md:px-6 md:py-4 text-center font-medium"
                >
                  End of Program
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-center uppercase text-xs lg:text-lg w-96 lg:w-full text-white select-none">
          ****This agenda is subject to change in case necessary.
        </p>
      </div>
    </div>
  );
}
