/**
 * MatchSlot Design System — Pitch Green
 * Stadium-inspired design: grass green, chalk white, floodlit night mode.
 * Feels like the pitch, not a SaaS dashboard.
 */

const pitch = '#1B8B4E';        // Turf green — primary
const pitchDark = '#157A42';    // Pressed / darker green
const pitchLight = '#4ADE80';   // Bright green accent
const chalk = '#F5F5EC';        // Chalk white / off-white

export const Colors = {
  light: {
    // Backgrounds
    text: '#1A2E1A',              // Deep forest
    background: '#F7FAF5',        // Lightest green-tinted white
    backgroundAlt: '#FFFFFF',     // Pure white for elevated surfaces
    tint: pitch,
    icon: '#5C7A5C',              // Muted green-grey
    tabIconDefault: '#94A894',    // Faded sage
    tabIconSelected: pitch,

    // Brand
    primary: pitch,
    primaryDark: pitchDark,
    primaryLight: '#E8F5E9',      // Very light green wash
    secondary: 'rgba(27,139,78,0.08)',    // Translucent green
    accent: pitchLight,                    // Bright green

    // Surfaces
    card: '#FFFFFF',
    cardBorder: '#D4E4D4',        // Light green border
    cardElevated: '#FFFFFF',

    // Text
    textSecondary: '#4A6B4A',     // Medium forest
    textTertiary: '#8FA88F',      // Light sage

    // Borders & Dividers
    border: '#D4E4D4',            // Soft green

    // Status
    success: '#16A34A',
    warning: '#F59E0B',
    error: '#EF4444',

    // Glow / Shadows
    glow: 'rgba(27, 139, 78, 0.15)',
    shadow: 'rgba(26, 46, 26, 0.08)',

    // Pitch-specific
    pitchLine: 'rgba(27, 139, 78, 0.12)',   // Subtle pitch line dividers
    scoreboardBg: '#1A2E1A',                  // Dark scoreboard background
    scoreboardText: '#FFFFFF',                 // Scoreboard white text
  },
  dark: {
    // Backgrounds — "Night match" feel
    text: '#E8F5E9',              // Light green-white
    background: '#0A1F12',        // Deep pitch at night
    backgroundAlt: '#122A1A',     // Slightly lighter green-black
    tint: pitchLight,
    icon: '#8FA88F',              // Sage
    tabIconDefault: '#5C7A5C',    // Muted green
    tabIconSelected: pitchLight,

    // Brand
    primary: pitchLight,
    primaryDark: pitch,
    primaryLight: 'rgba(74,222,128,0.1)',
    secondary: 'rgba(74,222,128,0.12)',
    accent: '#86EFAC',            // Lighter green

    // Surfaces
    card: '#122A1A',              // Dark green surface
    cardBorder: '#1E3D28',        // Green-tinted border
    cardElevated: '#1E3D28',

    // Text
    textSecondary: '#8FA88F',     // Sage
    textTertiary: '#5C7A5C',      // Muted green

    // Borders & Dividers
    border: '#1E3D28',            // Dark green border

    // Status
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',

    // Glow / Shadows
    glow: 'rgba(74, 222, 128, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.5)',

    // Pitch-specific
    pitchLine: 'rgba(74, 222, 128, 0.08)',
    scoreboardBg: '#0A1F12',
    scoreboardText: '#E8F5E9',
  },
};
