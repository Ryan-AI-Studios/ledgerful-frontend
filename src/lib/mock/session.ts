import { UserSession } from "@/lib/types";

export function fetchSession(): Promise<UserSession> {
  return Promise.resolve({
    id: "user-1",
    name: "Yuri",
    email: "yuri@example.com",
    role: "admin",
  });
}
