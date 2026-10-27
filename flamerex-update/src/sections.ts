export const SECTIONS = ["home", "events", "intelligence", "analytics", "about", "contact"] as const;
export type Section = (typeof SECTIONS)[number];

interface Info { num: string; label: string; title: string; description: string; symbol: string; }

export const SECTION_INFO: Record<Section, Info> = {
  home: { num: "01", label: "Home", title: "Home", description: "", symbol: "◈" },
  events: { num: "02", label: "Security events", title: "Security Events", description: "Event table, search, filters, severity levels and incident management.", symbol: "⌁" },
  intelligence: { num: "03", label: "Threat intelligence", title: "Threat Intelligence", description: "3D threat map and the live threat feed.", symbol: "◎" },
  analytics: { num: "04", label: "Analytics", title: "Analytics", description: "Charts, statistics and the distribution of attacks.", symbol: "▥" },
  about: { num: "05", label: "About", title: "About", description: "Introduction, skills, technologies and the purpose of this project.", symbol: "◇" },
  contact: { num: "06", label: "Contact", title: "Contact", description: "Email, LinkedIn and GitHub.", symbol: "✉" },
};

export const readHash = (): Section => {
  const h = window.location.hash.replace("#", "");
  return (SECTIONS as readonly string[]).includes(h) ? (h as Section) : "home";
};
