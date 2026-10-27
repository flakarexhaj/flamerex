import { PROFILE } from "../profile";

const LINKS = [
  { label: "Email", value: PROFILE.email, href: `mailto:${PROFILE.email}`, external: false },
  { label: "LinkedIn", value: PROFILE.linkedin.replace("https://www.", ""), href: PROFILE.linkedin, external: true },
  { label: "GitHub", value: PROFILE.github.replace("https://", ""), href: PROFILE.github, external: true },
];

export default function ContactSection() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {LINKS.map((l) => (
        <section key={l.label} className="rounded-2xl border border-violet-500/20 bg-slate-900/70 transition-colors hover:border-violet-400/50">
          <a href={l.href} {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})} className="block rounded-2xl p-6">
            <p className="text-sm text-slate-400">{l.label}</p>
            <p className="mt-2 break-all font-mono text-sm font-medium">{l.value}</p>
          </a>
        </section>
      ))}
    </div>
  );
}
