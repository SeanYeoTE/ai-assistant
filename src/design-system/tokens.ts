// Command Deck design system — canonical tokens.
// Source: AMP_HANDOVER.md §9. Implement against these; don't re-derive.

import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { WorkSans_400Regular, WorkSans_500Medium, WorkSans_600SemiBold } from '@expo-google-fonts/work-sans';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';

export const Color = {
  background: '#14171C',
  surface: '#1D2128',
  surfaceElevated: '#262B33',
  textPrimary: '#F3F5F7',
  textSecondary: '#8B94A3',
  accentPrimary: '#4FD1C5',
  domain: {
    fitness: '#F2A93B',
    reminders: '#4FD1C5',
    skincare: '#E8779E',
    growth: '#9B8CFF',
    meds: '#6FCF7A',
  },
  success: '#6FCF7A',
} as const;

export type DomainKey = keyof typeof Color.domain;

export const FontFamily = {
  display: 'SpaceGrotesk_700Bold',
  displaySemibold: 'SpaceGrotesk_600SemiBold',
  displayMedium: 'SpaceGrotesk_500Medium',
  body: 'WorkSans_400Regular',
  bodyMedium: 'WorkSans_500Medium',
  bodySemibold: 'WorkSans_600SemiBold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const;

export const TypeScale = {
  display: { fontSize: 34, lineHeight: 40, fontFamily: FontFamily.display },
  h1: { fontSize: 24, lineHeight: 30, fontFamily: FontFamily.display },
  h2: { fontSize: 19, lineHeight: 24, fontFamily: FontFamily.displaySemibold },
  bodyLarge: { fontSize: 17, lineHeight: 24, fontFamily: FontFamily.bodyMedium },
  body: { fontSize: 15, lineHeight: 21, fontFamily: FontFamily.body },
  caption: { fontSize: 13, lineHeight: 18, fontFamily: FontFamily.body },
  micro: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: FontFamily.bodySemibold,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

export const Elevation = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 12,
  },
} as const;

export const GoogleFontsToLoad = {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
};
