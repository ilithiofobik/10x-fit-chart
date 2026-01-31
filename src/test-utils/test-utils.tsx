/**
 * Test Utilities
 * Helper functions for testing React components
 */

import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * Custom render function with providers
 * Extend this as needed with Context providers, Router, etc.
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  // Add your providers here if needed
  // Example: const Wrapper = ({ children }: { children: React.ReactNode }) => (
  //   <SomeProvider><OtherProvider>{children}</OtherProvider></SomeProvider>
  // );

  return render(ui, { ...options });
}

// Re-export everything from Testing Library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
