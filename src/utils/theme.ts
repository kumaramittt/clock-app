import type { AccentColor } from '../types/clock.ts';

export interface AccentTheme {
  primaryBg: string;
  primaryHover: string;
  gradient: string;
  text: string;
  textLight: string;
  border: string;
  ring: string;
  shadow: string;
  hex: string;
  contrastText: string;
  softBg: string;
}

export const ACCENT_PALETTE: Record<
  AccentColor,
  {
    dark: { hex: string; contrast: string; soft: string; border: string };
    light: { hex: string; contrast: string; soft: string; border: string };
  }
> = {
  amber: {
    dark: { hex: '#F59E0B', contrast: '#000000', soft: 'rgba(245, 158, 11, 0.18)', border: 'rgba(245, 158, 11, 0.35)' },
    light: { hex: '#D97706', contrast: '#FFFFFF', soft: 'rgba(217, 119, 6, 0.14)', border: 'rgba(217, 119, 6, 0.35)' },
  },
  sky: {
    dark: { hex: '#38BDF8', contrast: '#000000', soft: 'rgba(56, 189, 248, 0.18)', border: 'rgba(56, 189, 248, 0.35)' },
    light: { hex: '#0284C7', contrast: '#FFFFFF', soft: 'rgba(2, 132, 199, 0.14)', border: 'rgba(2, 132, 199, 0.35)' },
  },
  emerald: {
    dark: { hex: '#10B981', contrast: '#000000', soft: 'rgba(16, 185, 129, 0.18)', border: 'rgba(16, 185, 129, 0.35)' },
    light: { hex: '#059669', contrast: '#FFFFFF', soft: 'rgba(5, 150, 105, 0.14)', border: 'rgba(5, 150, 105, 0.35)' },
  },
  indigo: {
    dark: { hex: '#818CF8', contrast: '#000000', soft: 'rgba(129, 140, 248, 0.18)', border: 'rgba(129, 140, 248, 0.35)' },
    light: { hex: '#4F46E5', contrast: '#FFFFFF', soft: 'rgba(79, 70, 229, 0.14)', border: 'rgba(79, 70, 229, 0.35)' },
  },
  rose: {
    dark: { hex: '#FB7185', contrast: '#000000', soft: 'rgba(251, 113, 133, 0.18)', border: 'rgba(251, 113, 133, 0.35)' },
    light: { hex: '#E11D48', contrast: '#FFFFFF', soft: 'rgba(225, 29, 72, 0.14)', border: 'rgba(225, 29, 72, 0.35)' },
  },
};

export function getEffectiveTheme(theme: 'dark' | 'light' | 'system'): 'dark' | 'light' {
  if (theme === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }
  return theme;
}

export function applyTheme(theme: 'dark' | 'light' | 'system', accent: AccentColor = 'amber'): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark';

  const effective = getEffectiveTheme(theme);
  const root = document.documentElement;

  root.classList.remove('dark', 'light');
  root.classList.add(effective);
  root.setAttribute('data-theme', effective);

  const palette = ACCENT_PALETTE[accent] || ACCENT_PALETTE.amber;
  const config = palette[effective];

  root.style.setProperty('--accent', config.hex);
  root.style.setProperty('--accent-contrast', config.contrast);
  root.style.setProperty('--accent-soft', config.soft);
  root.style.setProperty('--accent-border', config.border);

  // Update theme-color meta tag for phone status bar
  const metaTheme = document.getElementById('theme-color-meta');
  if (metaTheme) {
    metaTheme.setAttribute('content', effective === 'dark' ? '#0F0F10' : '#F5F5F7');
  }

  return effective;
}

export function getAccentTheme(accent: AccentColor = 'amber', effective: 'dark' | 'light' = 'dark'): AccentTheme {
  const palette = ACCENT_PALETTE[accent] || ACCENT_PALETTE.amber;
  const config = palette[effective] || palette.dark;

  return {
    primaryBg: 'bg-[var(--accent)]',
    primaryHover: 'hover:opacity-90',
    gradient: 'from-[var(--accent)] to-[var(--accent)]',
    text: 'text-[var(--accent)]',
    textLight: 'text-[var(--accent)]',
    border: 'border-[var(--accent-border)]',
    ring: 'ring-[var(--accent)]',
    shadow: 'shadow-[var(--accent)]/20',
    hex: config.hex,
    contrastText: config.contrast,
    softBg: config.soft,
  };
}
