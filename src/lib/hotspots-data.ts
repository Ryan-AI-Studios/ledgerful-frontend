export interface Hotspot {
  rank: number;
  filePath: string;
  score: number;
  trend: number[];
}

export const hotspotsData: Hotspot[] = [
  {
    rank: 1,
    filePath: "src/crypto/key.rs",
    score: 8.2,
    trend: [1, 2, 3, 5, 6, 7, 8, 8, 8, 9, 9, 10],
  },
  {
    rank: 2,
    filePath: "src/auth/session.rs",
    score: 6.4,
    trend: [1, 1, 2, 3, 5, 6, 7, 7, 8, 8, 9, 9],
  },
  {
    rank: 3,
    filePath: "src/ledger/apply.rs",
    score: 4.1,
    trend: [2, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 6],
  },
  {
    rank: 4,
    filePath: "src/bridge/ipc.rs",
    score: 3.7,
    trend: [3, 3, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5],
  },
  {
    rank: 5,
    filePath: "src/api/users.rs",
    score: 3.2,
    trend: [1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5],
  },
  {
    rank: 6,
    filePath: "src/state/storage.rs",
    score: 2.8,
    trend: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4],
  },
];

export function fetchHotspots(): Promise<Hotspot[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...hotspotsData]), 500);
  });
}
