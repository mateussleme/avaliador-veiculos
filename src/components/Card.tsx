import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '../theme/tokens';

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.border,
  padding: spacing.lg,

  shadowColor: '#16243B',
  shadowOpacity: 0.06,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 2,
  },
  sectionLabel: {
    fontSize: type.label.fontSize,
    fontWeight: type.label.fontWeight,
    letterSpacing: type.label.letterSpacing,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
});
