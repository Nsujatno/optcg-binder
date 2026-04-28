import type { CardRecord, SetRecord } from "@/lib/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getSetsClient() {
  return requestJson<{ sets: SetRecord[] }>("/api/sets");
}

export async function getCardsBySetClient(setId: string) {
  return requestJson<{ cards: CardRecord[] }>(
    `/api/sets/${encodeURIComponent(setId)}/cards`,
  );
}

export async function searchCardsClient(query: string, setId: string) {
  return requestJson<{ cards: CardRecord[] }>(
    `/api/cards/search?q=${encodeURIComponent(query)}&setId=${encodeURIComponent(setId)}`,
  );
}
