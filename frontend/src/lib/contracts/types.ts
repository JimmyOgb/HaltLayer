export type HaltCapability = "HALT" | "SAFE_MODE" | "ALL";
export type EvidenceQuality = "strong" | "moderate" | "weak";
export type ProtectionStatus =
  | "ACTIVE"
  | "HALTED"
  | "SAFE_MODE"
  | "UNDER_INVESTIGATION"
  | "NOT_REGISTERED";

export type IncidentStatus =
  | "SUBMITTED"
  | "ADJUDICATING"
  | "HALT_ACCEPTED"
  | "REJECTED"
  | "APPEALED"
  | "FINAL_HALT"
  | "RESOLVED_RESUME";

export type ThreatSeverity = "none" | "low" | "medium" | "high" | "critical";
export type RecommendedAction = "NO_ACTION" | "SAFE_MODE" | "HALT";

export interface ProtectedProtocol {
  target_address: string;
  name: string;
  owner: string;
  authorized_halt_capability: HaltCapability;
  min_evidence_quality: EvidenceQuality;
  is_active: boolean;
  protection_status: ProtectionStatus;
}

export interface Incident {
  incident_id: string;
  target_address: string;
  reporter: string;
  description: string;
  tx_hashes: string;
  evidence_urls: string;
  submitted_at: string;
  status: IncidentStatus;
  threat_severity: ThreatSeverity;
  recommended_action: RecommendedAction;
  evidence_quality: EvidenceQuality;
  adjudication_reason: string;
  appellant: string;
  appeal_reason: string;
  appeal_resolution: string;
  evidence_supports_action?: boolean;
  independent_target_match?: boolean;
  confidence?: string;
}

export interface DemoVaultState {
  address: string;
  owner: string;
  circuit_breaker: string;
  total_staked: number;
  is_paused: boolean;
  is_safe_mode: boolean;
  user_balance: number;
}

export interface ContractState {
  network: {
    name: string;
    rpcUrl: string;
    connected: boolean;
    error: string | null;
  };
  haltLayer: {
    address: string;
    admin: string;
    protocolCount: number;
    incidentCount: number;
    protocols: Record<string, ProtectedProtocol>;
    incidents: Incident[];
  };
  demoVault: DemoVaultState | null;
  lastUpdated: number | null;
  isRefreshing: boolean;
}

export interface SubmitIncidentInput {
  target: string;
  description: string;
  txHashes: string;
  evidenceUrls: string;
}

export interface TransactionStatus {
  hash: string;
  type: "submit_incident" | "adjudicate" | "appeal" | "resolve_appeal" | "deposit" | "withdraw" | "pause" | "resume";
  status: "pending" | "confirmed" | "failed";
  message?: string;
  timestamp: number;
}
