import type { AttackType, SecurityEvent, Severity } from "./types";

export const ATTACK_TYPES: AttackType[] = ["Brute force", "SQL injection", "XSS", "Port scan", "DDoS", "Malware", "Phishing"];
export const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
export const SEVERITY_RANK: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const COUNTRIES = ["Russia", "China", "USA", "Brazil", "Germany", "India", "Iran", "Vietnam", "Ukraine", "Nigeria"];
const TARGETS = ["api.gateway", "auth-service", "web-frontend", "db-primary", "mail-relay", "vpn-edge"];

// Seeded PRNG so the demo data looks the same on every load
let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

let nextId = 1;
export function makeEvent(time: number): SecurityEvent {
  const r = rnd();
  const severity: Severity = r > 0.93 ? "critical" : r > 0.72 ? "high" : r > 0.4 ? "medium" : "low";
  const old = Date.now() - time > 3600_000;
  return {
    id: nextId++, time, severity,
    type: pick(ATTACK_TYPES),
    status: old ? (rnd() > 0.35 ? "resolved" : "investigating") : "open",
    ip: `${Math.floor(rnd() * 223) + 1}.${Math.floor(rnd() * 255)}.${Math.floor(rnd() * 255)}.${Math.floor(rnd() * 255)}`,
    country: pick(COUNTRIES),
    target: pick(TARGETS),
  };
}

export function seedEvents(count = 240): SecurityEvent[] {
  const now = Date.now();
  return Array.from({ length: count }, () => makeEvent(now - rnd() * 14 * 86400_000)).sort((a, b) => b.time - a.time);
}
