"use client";

import { useEffect, useState } from "react";

export default function HeroTitle() {
  const [fontLoaded, setFontLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    const to = window.setTimeout(() => {
      if (!mounted) return;
      setTimedOut(true);
    }, 3000);

    const fonts = (document as unknown as { fonts?: FontFaceSet }).fonts;

    if (fonts?.load) {
      fonts
        .load("1em OdenaGlamour")
        .then((faces) => {
          if (!mounted) return;
          if (faces.length > 0) setFontLoaded(true);
          else setTimedOut(true);
        })
        .catch(() => {
          if (!mounted) return;
          setTimedOut(true);
        })
        .finally(() => window.clearTimeout(to));
    } else {
      window.setTimeout(() => {
        if (!mounted) return;
        setTimedOut(true);
      }, 0);
      window.clearTimeout(to);
    }

    return () => {
      mounted = false;
      window.clearTimeout(to);
    };
  }, []);

  const waiting = !fontLoaded && !timedOut;

  return (
    <>
      {waiting ? (
        <div className="w-full max-w-xl h-22 md:h-30 flex items-center justify-center">
          <div className="skeleton-title w-72 md:w-96 h-12 md:h-20 rounded-full" aria-hidden />
        </div>
      ) : (
        <h1
          style={{ fontFamily: fontLoaded ? "OdenaGlamour" : undefined }}
          className={`text-5xl text-center text-white mb-6 tracking-[0.2em] uppercase drop-shadow-2xl transition-opacity duration-500 select-none ${
            fontLoaded ? "opacity-100" : "opacity-100"
          }`}
        >
          SOFT <br /> LAUNCH
        </h1>
      )}
    </>
  );
}
