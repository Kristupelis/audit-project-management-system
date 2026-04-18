type Locale = "en" | "lt";

const errorTexts = {
  en: {
    somethingWentWrong: "Something went wrong.",
    projectLocked: "This project is locked. Only the project owner or administrator can open it.",
    fallback: "Something went wrong. Please try again.",
    noPermission: "You do not have permission to perform this action.",
    unauthorized: "Your session has expired or you are not logged in.",
    notProjectMember: "You are not a member of this project.",
    notFound: "The requested item was not found.",
    nameMin: "Name must be at least 2 characters long.",
    descriptionMin: "Description must be at least 2 characters long.",
    emailInUse: "This email address is already in use.",
    currentPasswordIncorrect: "Current password is incorrect.",
    newPasswordMustDiffer:
      "New password must be different from the current password.",
    invalidEmail: "Please enter a valid email address.",
    userNotFound: "User was not found.",
    memberUserNotFound:
      "The account was not found. The user must register first.",
    memberAlreadyExists: "This user is already a project member.",
    useOwnAccountPage:
      "Use your account page to update your own profile or password.",
    mustBeAtLeast: (field: string, count: string) =>
      `${field} must be at least ${count} characters long.`,
    isRequired: (field: string) => `${field} is required.`,
    mustBeText: (field: string) => `${field} must be text.`,
  },
  lt: {
    somethingWentWrong: "Įvyko klaida.",
    projectLocked: "Šis projektas yra užrakintas. Jį atidaryti gali tik projekto savininkas arba administratorius.",
    fallback: "Įvyko klaida. Bandykite dar kartą.",
    noPermission: "Jūs neturite teisės atlikti šio veiksmo.",
    unauthorized: "Jūsų sesija pasibaigė arba nesate prisijungę.",
    notProjectMember: "Jūs nesate šio projekto narys.",
    notFound: "Prašomas objektas nerastas.",
    nameMin: "Pavadinimas turi būti bent 2 simbolių ilgio.",
    descriptionMin: "Aprašymas turi būti bent 2 simbolių ilgio.",
    emailInUse: "Šis el. pašto adresas jau naudojamas.",
    currentPasswordIncorrect: "Dabartinis slaptažodis yra neteisingas.",
    newPasswordMustDiffer:
      "Naujas slaptažodis turi skirtis nuo dabartinio slaptažodžio.",
    invalidEmail: "Įveskite teisingą el. pašto adresą.",
    userNotFound: "Naudotojas nerastas.",
    memberUserNotFound:
      "Paskyra nerasta. Naudotojas pirmiausia turi užsiregistruoti.",
    memberAlreadyExists: "Šis naudotojas jau yra projekto narys.",
    useOwnAccountPage:
      "Savo profilio duomenis ar slaptažodį keiskite paskyros puslapyje.",
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
      email: "El. paštas",
      password: "Slaptažodis",
      currentpassword: "Dabartinis slaptažodis",
      newpassword: "Naujas slaptažodis",
    };

    return ltFieldMap[normalized] ?? field.trim();
  }

  return normalizeSentence(field, locale).replace(/\.$/, "");
}

export function toUserFriendlyError(
  raw: string,
  locale: Locale = "en",
): string {
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

  if (normalized.includes("member_user_not_found")) {
    return t.memberUserNotFound;
  }

  if (normalized.includes("member_already_exists")) {
    return t.memberAlreadyExists;
  }

  if (
    normalized.includes("use your account page to update your own profile") ||
    normalized.includes("use your account page to change your own password")
  ) {
    return t.useOwnAccountPage;
  }

  if (normalized.includes("missing permission")) {
    return t.noPermission;
  }

  if (normalized.includes("project_locked")) {
    return t.projectLocked;
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

  if (normalized.includes("email already in use")) {
    return t.emailInUse;
  }

  if (normalized.includes("current password is incorrect")) {
    return t.currentPasswordIncorrect;
  }

  if (
    normalized.includes("new password must be different from current password")
  ) {
    return t.newPasswordMustDiffer;
  }

  if (normalized.includes("email must be a valid email address")) {
    return t.invalidEmail;
  }

  if (normalized === "user not found") {
    return t.userNotFound;
  }

  if (normalized === "name must be longer than or equal to 2 characters") {
    return t.nameMin;
  }

  if (
    normalized === "description must be longer than or equal to 2 characters"
  ) {
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