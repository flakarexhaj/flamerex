import { PROFILE } from "../profile";

const LINKS = [
  { label: "Email", value: PROFILE.email, href: `mailto:${PROFILE.email}`, external: false },
  { label: "LinkedIn", value: PROFILE.linkedin.replace("https://www.", ""), href: PROFILE.linkedin, external: true },
  { label: "GitHub", value: PROFILE.github.replace("https://", ""), href: PROFILE.github, external: true },
];

export default function ContactSection() {
  return (
    <ul className="max-w-2xl divide-y divide-violet-500/10 border-y border-violet-500/15">
      {LINKS.map((l) => (
        <li key={l.label}>
          <a
            href={l.href}
            {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
            className="flex flex-wrap items-baseline justify-between gap-2 py-5 transition-colors hover:text-violet-200"
          >
            <span className="text-sm text-slate-400">{l.label}</span>
            <span className="break-all font-mono text-sm">{l.value} →</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
