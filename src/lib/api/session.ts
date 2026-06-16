import { apiGet } from "../api";
import { UserSession } from "@/lib/types";

export async function fetchSession(): Promise<UserSession> {
  const data = await apiGet<UserSession>("/session");
  return data;
}
