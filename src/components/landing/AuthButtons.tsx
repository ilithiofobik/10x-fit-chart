import type { AuthButtonsProps } from "./types";
import { Button } from "@/components/ui/button";

/**
 * AuthButtons component
 * Displays authentication buttons based on user session state
 * - For unauthenticated users: shows "Zaloguj się" and "Zarejestruj się"
 * - For authenticated users: shows "Przejdź do aplikacji"
 */
export function AuthButtons({ isAuthenticated }: AuthButtonsProps) {
  if (isAuthenticated) {
    return (
      <div className="flex justify-center">
        <Button asChild size="lg">
          <a href="/app/dashboard">Przejdź do aplikacji</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <Button asChild size="lg">
        <a href="/register">Rozpocznij za darmo</a>
      </Button>
      <Button asChild variant="outline" size="lg">
        <a href="/login">Zaloguj się</a>
      </Button>
    </div>
  );
}
