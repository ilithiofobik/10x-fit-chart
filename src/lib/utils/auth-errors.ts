/**
 * Centralized error mapper for Supabase Auth errors
 * Maps English error messages to Polish user-friendly messages
 */

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Login/Registration errors
  "Invalid login credentials": "Nieprawidłowy email lub hasło",
  "Email not confirmed": "Potwierdź swój adres email",
  "User already registered": "Ten adres email jest już zarejestrowany",
  "User not found": "Nie znaleziono użytkownika",
  "Invalid email": "Nieprawidłowy format adresu email",
  "Password should be at least 6 characters": "Hasło musi mieć minimum 8 znaków",

  // Session errors
  "Auth session missing": "Sesja wygasła. Zaloguj się ponownie",
  "JWT expired": "Sesja wygasła. Zaloguj się ponownie",
  "Invalid token": "Nieprawidłowy token sesji",

  // Rate limiting
  "Email rate limit exceeded": "Zbyt wiele prób. Spróbuj ponownie później",
  "Too many requests": "Zbyt wiele prób. Spróbuj ponownie później",

  // Network errors
  "Failed to fetch": "Problem z połączeniem. Sprawdź internet",
  "Network error": "Problem z połączeniem. Spróbuj ponownie",

  // Account management
  "User deletion failed": "Nie udało się usunąć konta",
  "Signout failed": "Nie udało się wylogować",
};

/**
 * Maps Supabase error message to user-friendly Polish message
 * @param supabaseError - Error message from Supabase
 * @param fallback - Optional custom fallback message
 * @returns User-friendly error message in Polish
 */
export function mapAuthError(
  supabaseError: string | undefined,
  fallback = "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."
): string {
  if (!supabaseError) return fallback;

  // Exact match
  if (AUTH_ERROR_MESSAGES[supabaseError]) {
    return AUTH_ERROR_MESSAGES[supabaseError];
  }

  // Partial match (case-insensitive)
  const lowerError = supabaseError.toLowerCase();
  for (const [key, value] of Object.entries(AUTH_ERROR_MESSAGES)) {
    if (lowerError.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Log unknown errors for debugging (server-side only)
  if (typeof window === "undefined") {
    console.error("[Auth Error Mapper] Unknown error:", supabaseError);
  }

  return fallback;
}

/**
 * Checks if error indicates email already exists
 */
export function isEmailExistsError(error: string | undefined): boolean {
  if (!error) return false;
  const lower = error.toLowerCase();
  return lower.includes("already registered") || lower.includes("duplicate") || lower.includes("already exists");
}

/**
 * Checks if error indicates invalid credentials
 */
export function isInvalidCredentialsError(error: string | undefined): boolean {
  if (!error) return false;
  const lower = error.toLowerCase();
  return lower.includes("invalid login") || lower.includes("invalid credentials") || lower.includes("wrong password");
}
