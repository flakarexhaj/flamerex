import { useEffect, useState } from "react";
import { SECTION_INFO, type Section } from "../sections";

const BAR = 64; // height of the bottom navigation bar, in px

interface Hotspot { label: string; to: Section; x: number; y: number; w: number; h: number; }
interface Poster { src: string; w: number; h: number; spots: Hotspot[]; }

const ALT =
  "FLAMEREX. Exploring the intersection of cybersecurity, technology and creativity. Analyze. Protect. Build a safer digital world.";

// Hotspot coordinates are in pixels of each poster image.
const DESKTOP: Poster = {
  src: "/poster-desktop.webp", w: 1672, h: 941,
  spots: [
    { label: "Security events", to: "events", x: 686, y: 52, w: 206, h: 40 },
    { label: "Threat intelligence", to: "intelligence", x: 944, y: 52, w: 253, h: 36 },
    { label: "Analytics", to: "analytics", x: 1277, y: 52, w: 130, h: 36 },
    { label: "About", to: "about", x: 1477, y: 52, w: 86, h: 36 },
    { label: "See more: security events", to: "events", x: 1270, y: 325, w: 125, h: 90 },
    { label: "Security events", to: "events", x: 206, y: 340, w: 140, h: 66 },
    { label: "Threat intelligence", to: "intelligence", x: 206, y: 404, w: 300, h: 32 },
    { label: "Analytics", to: "analytics", x: 206, y: 438, w: 150, h: 32 },
  ],
};

const MOBILE: Poster = {
  src: "/poster-mobile.webp", w: 1024, h: 1536,
  spots: [
    { label: "Security events", to: "events", x: 350, y: 62, w: 160, h: 32 },
    { label: "Threat intelligence", to: "intelligence", x: 537, y: 62, w: 196, h: 32 },
    { label: "Analytics", to: "analytics", x: 763, y: 62, w: 105, h: 32 },
    { label: "About", to: "about", x: 899, y: 62, w: 71, h: 32 },
    { label: "See more: security events", to: "events", x: 820, y: 505, w: 120, h: 90 },
    { label: "Security events", to: "events", x: 75, y: 520, w: 125, h: 60 },
    { label: "Threat intelligence", to: "intelligence", x: 75, y: 578, w: 215, h: 26 },
    { label: "Analytics", to: "analytics", x: 75, y: 606, w: 130, h: 26 },
  ],
};

const INDEX: Section[] = ["events", "intelligence", "analytics", "about", "contact"];

// Wide screens get the desktop poster, tall screens (phones) get the mobile poster.
function useLandscape() {
  const query = "(orientation: landscape)";
  const [landscape, setLandscape] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setLandscape(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return landscape;
}

// Soft edges so the poster blends into the page background
const FEATHER = {
  maskImage:
    "linear-gradient(to right, transparent, #000 3%, #000 97%, transparent), linear-gradient(to bottom, transparent, #000 3%, #000 97%, transparent)",
  maskComposite: "intersect",
  WebkitMaskImage:
    "linear-gradient(to right, transparent, #000 3%, #000 97%, transparent), linear-gradient(to bottom, transparent, #000 3%, #000 97%, transparent)",
  WebkitMaskComposite: "source-in",
} as const;

export default function Landing({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const p = useLandscape() ? DESKTOP : MOBILE;

  return (
    <div className="flex min-h-svh flex-col" style={{ backgroundColor: "#07040d" }}>
      <div className="flex flex-1 items-center justify-center">
        <div
          className="relative"
          style={{ width: `min(100%, calc((100svh - ${BAR}px) * ${p.w / p.h}))`, aspectRatio: `${p.w} / ${p.h}` }}
        >
          <img src={p.src} alt={ALT} draggable={false} className="absolute inset-0 h-full w-full select-none" style={FEATHER} />
          {p.spots.map((s) => (
            <button
              key={`${s.label}-${s.x}-${s.y}`}
              onClick={() => onNavigate(s.to)}
              aria-label={s.label}
              title={s.label}
              className="absolute cursor-pointer rounded-sm transition-colors hover:bg-violet-500/15 focus-visible:bg-violet-500/20"
              style={{
                left: `${((s.x + s.w / 2) / p.w) * 100}%`,
                top: `${((s.y + s.h / 2) / p.h) * 100}%`,
                width: `${(s.w / p.w) * 100}%`,
                height: `${(s.h / p.h) * 100}%`,
                minWidth: 32,
                minHeight: 40,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>
      </div>

      <nav
        aria-label="Sections"
        className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-white/10 px-4 py-4 font-mono text-[11px] tracking-[0.2em] text-slate-400"
        style={{ minHeight: BAR }}
      >
        {INDEX.map((id) => (
          <button key={id} onClick={() => onNavigate(id)} className="uppercase transition-colors hover:text-white">
            <span className="mr-2 text-violet-400">{SECTION_INFO[id].num}</span>
            {SECTION_INFO[id].label}
          </button>
        ))}
      </nav>
    </div>
  );
}
