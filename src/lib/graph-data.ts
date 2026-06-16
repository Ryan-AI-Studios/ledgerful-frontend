import { RiskLevel } from "./types";

export interface GraphNode {
  id: string;
  symbol: string;
  filePath: string;
  risk: RiskLevel;
  edges: number;
  complexity: number;
}

export const graphNodes: GraphNode[] = [
  {
    id: "n1",
    symbol: "verify_hmac",
    filePath: "src/crypto/key.rs",
    risk: "HIGH",
    edges: 14,
    complexity: 42,
  },
  {
    id: "n2",
    symbol: "rate_limit_check",
    filePath: "src/auth/session.rs",
    risk: "HIGH",
    edges: 11,
    complexity: 35,
  },
  {
    id: "n3",
    symbol: "apply_wal_flush",
    filePath: "src/ledger/apply.rs",
    risk: "MEDIUM",
    edges: 8,
    complexity: 28,
  },
  {
    id: "n4",
    symbol: "bridge_connect",
    filePath: "src/bridge/ipc.rs",
    risk: "MEDIUM",
    edges: 6,
    complexity: 22,
  },
  {
    id: "n5",
    symbol: "user_cursor_next",
    filePath: "src/api/users.rs",
    risk: "MEDIUM",
    edges: 5,
    complexity: 18,
  },
  {
    id: "n6",
    symbol: "storage_index",
    filePath: "src/state/storage.rs",
    risk: "LOW",
    edges: 4,
    complexity: 14,
  },
  {
    id: "n7",
    symbol: "config_diff",
    filePath: "src/config/schema.rs",
    risk: "LOW",
    edges: 3,
    complexity: 10,
  },
];

export function fetchGraph(): Promise<GraphNode[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...graphNodes]), 500);
  });
}
