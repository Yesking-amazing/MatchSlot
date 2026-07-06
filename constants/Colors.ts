/**
 * MatchSlot Design System — "Editorial Turf"
 * Warm bone paper, deep-pine ink, a single lime accent, and a genuine
 * "night match" dark mode. Premium comes from type, space and restraint —
 * not stadium props. (Replaces the old literal "Pitch Green" system.)
 *
 * All hex values are authoritative per the Claude Design handoff.
 */

// Brand constants (theme-independent)
export const Brand = {
  pine: '#15603D',      // primary (light)
  pineDark: '#124E32',  // primary pressed (light)
  emerald: '#35D98A',   // primary (dark)
  emeraldInk: '#06231A',// ink on emerald
  lime: '#C8F03F',      // accent (both modes)
  limeInk: '#2B3A12',   // ink on lime
  bone: '#F6F3EA',      // page paper (light)
  night: '#0C130F',     // page (dark)
};

export const Colors = {
  light: {
    // Surfaces
    text: '#16241B',              // ink primary
    background: '#F6F3EA',        // bone / paper
    backgroundAlt: '#FBF9F2',     // sunk / secondary surface
    surfaceSunk: '#FBF9F2',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',

    // Brand
    tint: '#15603D',
    primary: '#15603D',           // pine
    primaryDark: '#124E32',       // pressed
    primaryInk: '#F6F3EA',        // text/icons on primary fill
    primaryTint: '#EEF3EA',       // pine wash fill
    primaryLight: '#EEF3EA',      // legacy alias
    secondary: '#EEF3EA',         // legacy alias (was translucent green)
    accent: '#C8F03F',            // lime
    accentInk: '#2B3A12',         // ink on lime

    // Text ramp
    textSecondary: '#4A5A4C',     // ink secondary
    textMuted: '#6E7A6E',         // muted
    textFaint: '#8A927F',         // faint / meta
    textTertiary: '#A49D88',      // disabled / placeholder

    // Borders & dividers
    border: '#E7E1D3',            // card border
    cardBorder: '#E7E1D3',        // legacy alias
    divider: '#E0DAC9',           // inside cards / rows
    dividerFine: '#EFEADD',       // hairline

    // Icons / tabs
    icon: '#6E7A6E',
    tabIconDefault: '#A49D88',
    tabIconSelected: '#15603D',

    // Status
    success: '#35D98A',
    warning: '#E8A83A',
    warningText: '#B6801F',
    error: '#C0554F',
    errorBorder: '#E0B3B3',

    // Shadows (kept minimal — cards are flat/bordered)
    glow: 'rgba(21,96,61,0.12)',
    shadow: 'rgba(0,0,0,0.06)',
    hairline: '#EFEADD',

    // Legacy aliases retired from the new system (kept so nothing crashes)
    pitchLine: '#E0DAC9',
    scoreboardBg: '#131E17',
    scoreboardText: '#EAF1EA',
  },
  dark: {
    // Surfaces — "night match"
    text: '#EAF1EA',              // ink primary
    background: '#0C130F',        // deep night
    backgroundAlt: '#101A14',     // sunk / played row
    surfaceSunk: '#101A14',
    card: '#131E17',
    cardElevated: '#22352A',      // raised (segmented active)

    // Brand
    tint: '#35D98A',
    primary: '#35D98A',           // emerald
    primaryDark: '#2BB673',       // pressed
    primaryInk: '#06231A',        // text/icons on primary fill
    primaryTint: 'rgba(53,217,138,0.12)',
    primaryLight: 'rgba(53,217,138,0.12)',
    secondary: 'rgba(53,217,138,0.14)',
    accent: '#C8F03F',            // lime
    accentInk: '#2B3A12',

    // Text ramp
    textSecondary: '#B7C4B8',     // ink secondary
    textMuted: '#8FA091',         // muted
    textFaint: '#7F8A78',         // faint / meta
    textTertiary: '#61705F',      // disabled

    // Borders & dividers
    border: 'rgba(255,255,255,0.08)',
    cardBorder: 'rgba(255,255,255,0.08)',
    divider: 'rgba(255,255,255,0.08)',
    dividerFine: 'rgba(255,255,255,0.06)',

    // Icons / tabs
    icon: '#8FA091',
    tabIconDefault: '#61705F',
    tabIconSelected: '#35D98A',

    // Status
    success: '#35D98A',
    warning: '#E8A83A',
    warningText: '#E8A83A',
    error: '#E06E6E',
    errorBorder: 'rgba(224,110,110,0.4)',

    // Shadows
    glow: 'rgba(53,217,138,0.15)',
    shadow: 'rgba(0,0,0,0.5)',
    hairline: 'rgba(255,255,255,0.06)',

    // Legacy aliases
    pitchLine: 'rgba(255,255,255,0.08)',
    scoreboardBg: '#0C130F',
    scoreboardText: '#EAF1EA',
  },
};

export type ThemeColors = typeof Colors.light;
