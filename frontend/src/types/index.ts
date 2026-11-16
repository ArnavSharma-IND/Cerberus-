export * from '../types';

export interface UserSession {
  username: string;
  role: 'admin' | 'soc_analyst' | 'auditor';
  token: string;
  expires_at: number;
}

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
}

export interface IncidentRecord {
  id: string;
  session_id: string;
  agent_id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  pillar: 'TAINT' | 'CANARY' | 'DLP' | 'SHIELD' | 'BEHAVIORAL' | 'POLICY';
  title: string;
  description: string;
  timestamp: string;
  status: 'ACTIVE' | 'RESOLVED' | 'QUARANTINED' | 'FALSE_POSITIVE';
  risk_score: number;
  indicators: string[];
  remediation?: string;
  lineage_hops?: any[];
}

export interface MarkovTransitionNode {
  source: string;
  target: string;
  probability: number;
  observed_count: number;
  is_anomalous: boolean;
}

export interface EnsembleWeights {
  rule: number;
  markov: number;
  isolation: number;
  transformer: number;
  anomaly_threshold: number;
  block_threshold: number;
  challenge_threshold: number;
}

export interface AttackTheaterScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  owasp_id: string;
  payload_summary: string;
  steps: {
    tool: string;
    description: string;
    args: Record<string, any>;
    expected_action: 'ALLOW' | 'CHALLENGE' | 'BLOCK' | 'QUARANTINE';
  }[];
}
