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
    text: '#1A2E1A',
    background: '#F7FAF5',
    backgroundAlt: '#FFFFFF',
    tint: pitch,
    icon: '#5C7A5C',
    tabIconDefault: '#94A894',
    tabIconSelected: pitch,

    // Brand
    primary: pitch,
    primaryDark: pitchDark,
    primaryLight: '#E8F5E9',
    secondary: 'rgba(27,139,78,0.08)',
    accent: pitchLight,

    // Surfaces
    card: '#FFFFFF',
    cardBorder: '#D4E4D4',
    cardElevated: '#FFFFFF',
    inputBg: '#FFFFFF',

    // Text
    textSecondary: '#4A6B4A',
    textTertiary: '#8FA88F',

    // Borders & Dividers
    border: '#D4E4D4',
    divider: 'rgba(27,139,78,0.10)',

    // Status
    success: '#16A34A',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#2563EB',

    // Glow / Shadows
    glow: 'rgba(27, 139, 78, 0.30)',
    shadow: 'rgba(26, 46, 26, 0.10)',

    // Pitch-specific
    pitchLine: 'rgba(27, 139, 78, 0.12)',
    scoreboardBg: '#0F2818',
    scoreboardSurface: '#163524',
    scoreboardText: '#FFFFFF',
    scoreboardMuted: 'rgba(255,255,255,0.55)',
  },
  dark: {
    text: '#E8F5E9',
    background: '#0A1F12',
    backgroundAlt: '#122A1A',
    tint: pitchLight,
    icon: '#8FA88F',
    tabIconDefault: '#5C7A5C',
    tabIconSelected: pitchLight,

    // Brand
    primary: pitchLight,
    primaryDark: pitch,
    primaryLight: 'rgba(74,222,128,0.10)',
    secondary: 'rgba(74,222,128,0.12)',
    accent: '#86EFAC',

    // Surfaces
    card: '#122A1A',
    cardBorder: '#1E3D28',
    cardElevated: '#1E3D28',
    inputBg: '#0E2415',

    // Text
    textSecondary: '#8FA88F',
    textTertiary: '#5C7A5C',

    // Borders & Dividers
    border: '#1E3D28',
    divider: 'rgba(74,222,128,0.10)',

    // Status
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',

    // Glow / Shadows
    glow: 'rgba(74, 222, 128, 0.30)',
    shadow: 'rgba(0, 0, 0, 0.55)',

    // Pitch-specific
    pitchLine: 'rgba(74, 222, 128, 0.08)',
    scoreboardBg: '#06140C',
    scoreboardSurface: '#0E2415',
    scoreboardText: '#E8F5E9',
    scoreboardMuted: 'rgba(232,245,233,0.55)',
  },
};
