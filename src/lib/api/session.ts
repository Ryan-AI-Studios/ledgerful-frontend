import { apiGet } from "../api";
import { UserSession } from "@/lib/types";
import type { ExtractResponse } from "./contract-types";

// Generated UserSession returns role as string, while UI narrows it to known roles.
type SessionWire = ExtractResponse<"/api/session", "get">;

function normalizeSessionRole(role: string): UserSession["role"] {
  if (role === "admin" || role === "member" || role === "viewer") return role;
  return undefined;
}

export async function fetchSession(): Promise<UserSession> {
  const data = await apiGet<SessionWire>("/session");
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: normalizeSessionRole(data.role),
  };
}
