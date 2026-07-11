import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radius, spacing, type } from '../theme/tokens';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface OptionGroupProps<T extends string> {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function OptionGroup<T extends string>({ options, value, onChange }: OptionGroupProps<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface ToggleRowProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function ToggleRow({ label, value, onChange }: ToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={styles.toggleChips}>
        <Pressable
          onPress={() => onChange(false)}
          style={[styles.toggleChip, !value && styles.toggleChipSelectedNeutral]}
        >
          <Text style={[styles.chipLabel, !value && styles.chipLabelSelected]}>Não</Text>
        </Pressable>
        <Pressable
          onPress={() => onChange(true)}
          style={[styles.toggleChip, value && styles.toggleChipSelectedAlert]}
        >
          <Text style={[styles.chipLabel, value && styles.chipLabelOnAlert]}>Sim</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    fontFamily: fontFamily.inter,
  },
  chipLabelSelected: {
    color: colors.textOnInk,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  toggleLabel: {
    fontSize: type.body.fontSize,
    color: colors.textPrimary,
    flex: 1,
    paddingRight: spacing.md,
    fontFamily: fontFamily.inter,
  },
  toggleChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    minWidth: 56,
    alignItems: 'center',
  },
  toggleChipSelectedNeutral: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  toggleChipSelectedAlert: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  chipLabelOnAlert: {
    color: colors.textOnInk,
  },
});
