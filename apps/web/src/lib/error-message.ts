type Locale = "en" | "lt";

const errorTexts = {
  en: {
    somethingWentWrong: "Something went wrong.",
    fallback: "Something went wrong. Please try again.",
    noPermission: "You do not have permission to perform this action.",
    unauthorized: "Your session has expired or you are not logged in.",
    notProjectMember: "You are not a member of this project.",
    notFound: "The requested item was not found.",
    nameMin: "Name must be at least 2 characters long.",
    descriptionMin: "Description must be at least 2 characters long.",
    mustBeAtLeast: (field: string, count: string) =>
      `${field} must be at least ${count} characters long.`,
    isRequired: (field: string) => `${field} is required.`,
    mustBeText: (field: string) => `${field} must be text.`,
  },
  lt: {
    somethingWentWrong: "Įvyko klaida.",
    fallback: "Įvyko klaida. Bandykite dar kartą.",
    noPermission: "Jūs neturite teisės atlikti šio veiksmo.",
    unauthorized: "Jūsų sesija pasibaigė arba nesate prisijungę.",
    notProjectMember: "Jūs nesate šio projekto narys.",
    notFound: "Praśomas objektas nerastas.",
    nameMin: "Pavadinimas turi būti bent 2 simbolių ilgio.",
    descriptionMin: "Aprašymas turi būti bent 2 simbolių ilgio.",
    mustBeAtLeast: (field: string, count: string) =>
      `${field} turi būti bent ${count} simbolių ilgio.`,
    isRequired: (field: string) => `Laukas „${field}“ yra privalomas.`,
    mustBeText: (field: string) => `Laukas „${field}“ turi būti tekstas.`,
  },
} as const;

function normalizeSentence(text: string, locale: Locale): string {
  const t = errorTexts[locale];
  const trimmed = text.trim();
  if (!trimmed) return t.somethingWentWrong;

  const withCapital = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

  return /[.!?]$/.test(withCapital) ? withCapital : `${withCapital}.`;
}

function translateFieldName(field: string, locale: Locale): string {
  const normalized = field.trim().toLowerCase();

  if (locale === "lt") {
    const ltFieldMap: Record<string, string> = {
      name: "Pavadinimas",
      description: "Aprašymas",
      title: "Pavadinimas",
      code: "Kodas",
      scope: "Apimtis",
      objective: "Tikslas",
      methodology: "Metodika",
      location: "Vieta",
      status: "Būsena",
      priority: "Prioritetas",
      type: "Tipas",
      severity: "Svarbumas",
    };

    return ltFieldMap[normalized] ?? field.trim();
  }

  return normalizeSentence(field, locale).replace(/\.$/, "");
}

export function toUserFriendlyError(raw: string, locale: Locale = "en"): string {
  const t = errorTexts[locale];
  const fallback = t.fallback;

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
    return t.noPermission;
  }

  if (normalized.includes("forbidden")) {
    return t.noPermission;
  }

  if (normalized.includes("unauthorized")) {
    return t.unauthorized;
  }

  if (normalized.includes("not a project member")) {
    return t.notProjectMember;
  }

  if (normalized.includes("not found")) {
    return t.notFound;
  }

  if (normalized === "name must be longer than or equal to 2 characters") {
    return t.nameMin;
  }

  if (normalized === "description must be longer than or equal to 2 characters") {
    return t.descriptionMin;
  }

  if (normalized.includes("must be longer than or equal to")) {
    const match = parsedMessage.match(
      /^(.+?) must be longer than or equal to (\d+) characters?$/i,
    );
    if (match) {
      const field = translateFieldName(match[1], locale);
      const number = match[2];
      return t.mustBeAtLeast(field, number);
    }
  }

  if (normalized.includes("should not be empty")) {
    const match = parsedMessage.match(/^(.+?) should not be empty$/i);
    if (match) {
      const field = translateFieldName(match[1], locale);
      return t.isRequired(field);
    }
  }

  if (normalized.includes("must be a string")) {
    const match = parsedMessage.match(/^(.+?) must be a string$/i);
    if (match) {
      const field = translateFieldName(match[1], locale);
      return t.mustBeText(field);
    }
  }

  return normalizeSentence(parsedMessage, locale);
}