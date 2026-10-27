import { PROFILE } from "../profile";

const SKILLS: Record<string, string[]> = {
  "Front-end": ["React", "TypeScript", "Tailwind CSS", "Vite"],
  "Data and visuals": ["Recharts", "TanStack Table", "Zustand", "Three.js"],
  "Quality and delivery": ["Vitest", "Testing Library", "Git", "Vercel"],
};

const FOCUS = [
  "Interfaces that make security data easy to read",
  "Web security basics: XSS, CSRF, SQL injection, authentication",
  "Accessible, responsive and tested front-end code",
];

const card = "rounded-2xl border border-violet-500/20 bg-slate-900/70 p-6";

export default function AboutSection() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className={`${card} lg:col-span-2`}>
        <h2 className="text-lg font-bold">{PROFILE.name}</h2>
        <p className="mt-1 text-sm text-violet-300">{PROFILE.role}</p>
        <p className="mt-4 max-w-prose text-sm leading-6 text-slate-300">
          FLAMEREX is where I explore the intersection of cybersecurity, technology and creativity. I build front-end
          projects that turn complex security data into something a person can understand at a glance.
        </p>
        <h3 className="mt-6 text-sm font-semibold">About this project</h3>
        <p className="mt-2 max-w-prose text-sm leading-6 text-slate-300">
          This site is a security operations dashboard running on simulated data. It has a live threat feed, a 3D
          threat map, analytics, and a searchable event log with incident status management. Everything runs in the
          browser, with no backend.
        </p>
        <h3 className="mt-6 text-sm font-semibold">Focus</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
          {FOCUS.map((f) => <li key={f}>{f}</li>)}
        </ul>
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold">Technologies</h2>
        <div className="mt-4 space-y-5">
          {Object.entries(SKILLS).map(([group, items]) => (
            <div key={group}>
              <h3 className="text-xs font-semibold text-slate-400">{group}</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {items.map((s) => (
                  <li key={s} className="rounded-md border border-violet-400/30 px-2.5 py-1 text-xs text-violet-200">{s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
