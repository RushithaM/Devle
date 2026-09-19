import { apiRequest } from "./client";
import type { AuthResponse, PublicUser } from "./types";

export function register(input: { name: string; email: string; password: string }) {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: { email: string; password: string }) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout() {
  return apiRequest<void>("/api/auth/logout", { method: "POST" });
}

export function getMe() {
  return apiRequest<{ user: PublicUser }>("/api/auth/me");
}
