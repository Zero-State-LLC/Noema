/**
 * Genesis theme packs — presentation constraints for first-world generation.
 * Theme ≠ lore. See docs/GENESIS-THEME.md.
 */

import { PERIHELION_THEME, type PerihelionTheme } from "./perihelion-reach";

export type GenesisTheme = PerihelionTheme;

/** Active first-world theme (single pack for now). */
export const FIRST_WORLD_THEME: GenesisTheme = PERIHELION_THEME;

export function themeForProfile(profile_id: string): GenesisTheme | null {
  if (profile_id === FIRST_WORLD_THEME.preferred_profile_id) return FIRST_WORLD_THEME;
  // Still allow theme vocabulary on other profiles if admin uses Perihelion naming
  return FIRST_WORLD_THEME;
}

export { PERIHELION_THEME };
