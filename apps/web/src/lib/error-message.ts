export function toUserFriendlyError(raw: string): string {
  const fallback = "Something went wrong. Please try again.";

  if (!raw || !raw.trim()) return fallback;

  let parsedMessage = raw.trim();

  try {
    const parsed = JSON.parse(raw) as {
      message?: string | string[];
      error?: string;
      statusCode?: number;
    };

    if (Array.isArray(parsed.message)) {
      parsedMessage = parsed.message.join(", ");
    } else if (typeof parsed.message === "string" && parsed.message.trim()) {
      parsedMessage = parsed.message.trim();
    }
  } catch {
    parsedMessage = raw.trim();
  }

  const normalized = parsedMessage.toLowerCase();

  if (normalized.includes("missing permission")) {
    return "You do not have permission to perform this action.";
  }

  if (normalized.includes("forbidden")) {
    return "You do not have permission to perform this action.";
  }

  if (normalized.includes("unauthorized")) {
    return "Your session has expired or you are not logged in.";
  }

  if (normalized.includes("not a project member")) {
    return "You are not a member of this project.";
  }

  if (normalized.includes("not found")) {
    return "The requested item was not found.";
  }

  if (normalized.includes("validation failed")) {
    return "Some entered values are invalid.";
  }

  if (normalized.includes("required")) {
    return "Please fill in all required fields.";
  }

  return parsedMessage || fallback;
}