export const colors = {
  bg:        '#05080f',
  surface1:  '#0a1220',
  surface2:  '#0f1a2b',
  surface3:  '#16243a',
  surface4:  '#1f3050',

  border1: 'rgba(255,255,255,0.06)',
  border2: 'rgba(255,255,255,0.10)',
  border3: 'rgba(79,195,247,0.30)',

  fg1: '#f3f7fb',
  fg2: '#c4d1e3',
  fg3: '#7a8aa0',
  fg4: '#4a5870',

  cyan50:  '#e6f7ff',
  cyan100: '#b8eeff',
  cyan200: '#7ee0ff',
  cyan300: '#4fc3f7',
  cyan400: '#2a9fd6',
  cyan500: '#1976a8',
  cyan600: '#155a82',
  cyan700: '#0e3d59',

  brand:      '#4fc3f7',
  brandBright:'#7ee0ff',
  brandDim:   '#1976a8',

  success: '#34d399',
  warning: '#fbbf24',
  danger:  '#f87171',
  info:    '#4fc3f7',
};

export const radii = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  pill: 999,
};

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
};

export const fontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  '2xl': 32,
};

export const fontWeight = {
  normal:    '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
};

export const tracking = {
  tight:  -0.4,
  normal: 0,
  wide:   0.6,
  caps:   1.4,
};
