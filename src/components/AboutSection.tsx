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

export default function AboutSection() {
  return (
    <div className="grid gap-12 lg:grid-cols-3">
      <section className="lg:col-span-2">
        <h2 className="text-xl font-bold">{PROFILE.name}</h2>
        <p className="mt-1 text-sm text-violet-300">{PROFILE.role}</p>
        <p className="mt-5 max-w-prose text-sm leading-6 text-slate-300">
          FLAMEREX is where I explore the intersection of cybersecurity, technology and creativity. I build front-end
          projects that turn complex security data into something a person can understand at a glance.
        </p>
        <h3 className="mt-8 text-sm font-semibold">About this project</h3>
        <p className="mt-2 max-w-prose text-sm leading-6 text-slate-300">
          This site is a security operations dashboard running on simulated data. It has a live threat feed, a 3D
          threat map, analytics, and a searchable event log with incident status management. Everything runs in the
          browser, with no backend.
        </p>
        <h3 className="mt-8 text-sm font-semibold">Focus</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
          {FOCUS.map((f) => <li key={f}>{f}</li>)}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold">Technologies</h2>
        <div className="mt-5 space-y-6">
          {Object.entries(SKILLS).map(([group, items]) => (
            <div key={group} className="border-t border-violet-500/15 pt-3">
              <h3 className="text-xs font-semibold text-slate-400">{group}</h3>
              <p className="mt-2 text-sm text-slate-200">{items.join(" · ")}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
