/**
 * Normalize `create_ticket` tool call arguments for the HITL card.
 * Handles streaming (args arrive after first paint) and naming variants.
 */
export type CreateTicketDraftArgs = {
  description?: string;
  location?: string;
  severity?: string;
  specialtyType?: string;
};

export function parseToolCallArgsRecord(
  raw: unknown,
): Record<string, unknown> | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, unknown>;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return undefined;
}

export function normalizeCreateTicketDraftArgs(
  raw?: Record<string, unknown>,
): CreateTicketDraftArgs {
  if (!raw) return {};

  const str = (keys: string[]) => {
    for (const key of keys) {
      const v = raw[key];
      if (typeof v === "string") return v;
    }
    return undefined;
  };

  return {
    description: str(["description"]),
    location: str(["location", "issue_location"]),
    severity: str(["severity"]),
    specialtyType: str(["specialtyType", "specialty_type"]),
  };
}
