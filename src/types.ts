export type Severity = "critical" | "high" | "medium" | "low";
export type Status = "open" | "investigating" | "resolved";
export type AttackType = "Brute force" | "SQL injection" | "XSS" | "Port scan" | "DDoS" | "Malware" | "Phishing";

export interface SecurityEvent {
  id: number;
  time: number; // epoch ms
  type: AttackType;
  severity: Severity;
  status: Status;
  ip: string;
  country: string;
  target: string;
}
