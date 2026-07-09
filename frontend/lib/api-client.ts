import type {
  CardRecord,
  RecommendationPlacementRecord,
  SetRecord,
  SlotRecommendationRecord,
} from "@/lib/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function buildApiError(response: Response) {
  const fallbackMessage = `API request failed: ${response.status}`;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return new ApiError(response.status, fallbackMessage);
  }

  try {
    const payload = (await response.json()) as { detail?: string; message?: string };
    const detail = payload.detail ?? payload.message;
    if (!detail) {
      return new ApiError(response.status, fallbackMessage);
    }
    return new ApiError(response.status, detail);
  } catch {
    return new ApiError(response.status, fallbackMessage);
  }
}

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw await buildApiError(response);
  }

  return (await response.json()) as T;
}

async function requestJsonWithBody<T>(path: string, body: object): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await buildApiError(response);
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

export async function getFilteredCardsClient(cardName: string) {
  return requestJson<{ cards: CardRecord[] }>(
    `/api/cards/filtered?card_name=${encodeURIComponent(cardName)}`,
  );
}

export async function getSlotRecommendationsClient(input: {
  selectedSlotId: string;
  templateId: string;
  placements: RecommendationPlacementRecord[];
}) {
  return requestJsonWithBody<{ recommendations: SlotRecommendationRecord[]; cached: boolean }>(
    "/api/ai/slot-recommendations",
    input,
  );
}
