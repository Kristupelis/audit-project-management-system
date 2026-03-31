function normalizeSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "Something went wrong.";

  const withCapital =
    trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

  return /[.!?]$/.test(withCapital) ? withCapital : `${withCapital}.`;
}

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

  if (normalized === "name must be longer than or equal to 2 characters") {
    return "Name must be at least 2 characters long.";
  }

  if (normalized === "description must be longer than or equal to 2 characters") {
    return "Description must be at least 2 characters long.";
  }

  if (normalized.includes("must be longer than or equal to")) {
    const match = parsedMessage.match(/^(.+?) must be longer than or equal to (\d+) characters?$/i);
    if (match) {
      const field = normalizeSentence(match[1]).replace(/\.$/, "");
      const number = match[2];
      return `${field} must be at least ${number} characters long.`;
    }
  }

  if (normalized.includes("should not be empty")) {
    const match = parsedMessage.match(/^(.+?) should not be empty$/i);
    if (match) {
      const field = normalizeSentence(match[1]).replace(/\.$/, "");
      return `${field} is required.`;
    }
  }

  if (normalized.includes("must be a string")) {
    const match = parsedMessage.match(/^(.+?) must be a string$/i);
    if (match) {
      const field = normalizeSentence(match[1]).replace(/\.$/, "");
      return `${field} must be text.`;
    }
  }

  return normalizeSentence(parsedMessage);
}