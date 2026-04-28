/**
 * ThemeController — Applies persisted theme preference
 *
 * Renders nothing. Just runs the useTheme hook to sync
 * the dark/light class on <html>.
 */

import { useTheme } from "@/hooks/app/useTheme";

export default function ThemeController() {
  useTheme();
  return null;
}
