/**
 * Editorial Turf type system.
 * Display / headlines / numerals -> Bricolage Grotesque (700, 800).
 * UI / body -> Figtree (400, 500, 600, 700).
 */
export const Fonts = {
  display: 'Bricolage',
  body: 'Figtree',
  mono: 'SpaceMono',
};

// Type scale (px) from the handoff.
export const Size = {
  greeting: 30,
  screenTitle: 26,
  publicDate: 24,
  xl: 20,
  section: 18,
  cardTitle: 17,
  slotTime: 16,
  button: 15,
  listTitle: 14,
  value: 13.5,
  body: 13,
  label: 12.5,
  chip: 12,
  meta: 11.5,
  micro: 11,
  finest: 10.5,
} as const;
