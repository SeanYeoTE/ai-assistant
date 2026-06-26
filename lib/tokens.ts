import type React from "react";

export const colors = {
  // Base
  bg: "#FAFAF9",
  surface: "#F5F5F4",
  surfaceHover: "#EFEDE8",
  border: "#E7E5E0",
  borderFocus: "#78A892",

  // Text
  textPrimary: "#1C1917",
  textSecondary: "#78716C",
  textMuted: "#A8A29E",
  textInverse: "#FAFAF9",

  // Accent (muted sage green)
  accent: "#5C8C76",
  accentLight: "#D4E8DF",
  accentDark: "#3D6B57",

  // Status
  success: "#5C8C76",
  warning: "#B45309",
  warningLight: "#FEF3C7",
  danger: "#DC2626",
  dangerLight: "#FEE2E2",
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  "2xl": 24,
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const styles = {
  card: (): React.CSSProperties => ({
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: spacing.lg,
  }),
  input: (): React.CSSProperties => ({
    width: "100%",
    padding: `${spacing.sm}px ${spacing.md}px`,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    background: colors.bg,
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  }),
  btnPrimary: (): React.CSSProperties => ({
    background: colors.accent,
    color: colors.textInverse,
    border: "none",
    borderRadius: radius.sm,
    padding: `${spacing.sm}px ${spacing.lg}px`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    cursor: "pointer",
    transition: "background 0.15s ease",
  }),
  btnSecondary: (): React.CSSProperties => ({
    background: "transparent",
    color: colors.accent,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    padding: `${spacing.sm}px ${spacing.lg}px`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    cursor: "pointer",
    transition: "background 0.15s ease, border-color 0.15s ease",
  }),
  label: (): React.CSSProperties => ({
    display: "block",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  }),
};
