import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import React from 'react';
import { StyleSheet, Text as RNText, TextProps } from 'react-native';

type Variant =
  | 'greeting'    // Bricolage 800, 30
  | 'title'       // Bricolage 800, 26
  | 'display'     // Bricolage 800 (size via style)
  | 'section'     // Bricolage 800, 18
  | 'cardTitle'   // Bricolage 800, 17
  | 'kicker'      // Figtree 700 uppercase micro-label
  | 'body'        // Figtree 400, 13
  | 'value'       // Figtree 700, 13.5
  | 'label'       // Figtree 600, 12.5
  | 'meta';       // Figtree 500, 11.5 muted

type Tone = 'ink' | 'secondary' | 'muted' | 'faint' | 'disabled' | 'primary' | 'accent' | 'error' | 'warning';

interface Props extends TextProps {
  variant?: Variant;
  tone?: Tone;
  color?: string;
}

export function Text({ variant = 'body', tone, color, style, ...props }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  const toneColor = (): string => {
    if (color) return color;
    switch (tone) {
      case 'secondary': return c.textSecondary;
      case 'muted': return c.textMuted;
      case 'faint': return c.textFaint;
      case 'disabled': return c.textTertiary;
      case 'primary': return c.primary;
      case 'accent': return scheme === 'dark' ? c.accent : c.primary;
      case 'error': return c.error;
      case 'warning': return c.warningText;
      default: return c.text;
    }
  };

  return (
    <RNText
      style={[variants[variant], { color: toneColor() }, style]}
      {...props}
    />
  );
}

const variants = StyleSheet.create({
  greeting: { fontFamily: Fonts.display, fontWeight: '800', fontSize: 30, letterSpacing: -1 },
  title: { fontFamily: Fonts.display, fontWeight: '800', fontSize: 26, letterSpacing: -0.8 },
  display: { fontFamily: Fonts.display, fontWeight: '800', letterSpacing: -1 },
  section: { fontFamily: Fonts.display, fontWeight: '800', fontSize: 18, letterSpacing: -0.5 },
  cardTitle: { fontFamily: Fonts.display, fontWeight: '800', fontSize: 17, letterSpacing: -0.3 },
  kicker: { fontFamily: Fonts.body, fontWeight: '700', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  body: { fontFamily: Fonts.body, fontWeight: '400', fontSize: 13 },
  value: { fontFamily: Fonts.body, fontWeight: '700', fontSize: 13.5 },
  label: { fontFamily: Fonts.body, fontWeight: '600', fontSize: 12.5 },
  meta: { fontFamily: Fonts.body, fontWeight: '500', fontSize: 11.5 },
});
