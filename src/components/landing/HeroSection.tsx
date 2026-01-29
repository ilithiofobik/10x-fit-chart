import type { HeroSectionProps } from "./types";
import { AuthButtons } from "./AuthButtons";

/**
 * HeroSection component
 * Main hero section of the Landing Page
 * Displays the app title, tagline, and authentication buttons
 */
export function HeroSection({ isAuthenticated }: HeroSectionProps) {
  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <div className="flex flex-col items-center gap-6">
          {/* App Title */}
          <h1 className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
            10xFitChart
          </h1>

          {/* Tagline */}
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground sm:text-2xl">
            Śledź postępy treningowe z precyzją. Desktop-first aplikacja do
            analizy siłowej i cardio.
          </p>

          {/* CTA Buttons */}
          <div className="mt-4">
            <AuthButtons isAuthenticated={isAuthenticated} />
          </div>
        </div>
      </div>
    </section>
  );
}
