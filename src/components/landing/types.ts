/**
 * Landing Page Component Types
 * Types for all components used in the Landing Page view
 */

/**
 * Props dla głównej sekcji Hero
 */
export interface HeroSectionProps {
  isAuthenticated: boolean;
}

/**
 * Props dla komponentu przycisków autoryzacyjnych
 */
export interface AuthButtonsProps {
  isAuthenticated: boolean;
}

/**
 * Pojedyncza funkcja aplikacji do wyświetlenia
 */
export interface FeatureItem {
  title: string;
  description: string;
  icon: string; // Nazwa ikony z lucide-react (np. "BarChart3", "Keyboard")
}

/**
 * Props dla siatki funkcji
 */
export interface FeatureGridProps {
  features: FeatureItem[];
}

/**
 * Props dla pojedynczej karty funkcji
 */
export interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}
