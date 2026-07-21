import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily, spacing, type } from '../theme/tokens';

export type TabKey = 'evaluate' | 'history' | 'contacts';

interface TabBarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'evaluate', label: 'Avaliar',   icon: '＋' },
  { key: 'history',  label: 'Histórico', icon: '☰' },
  { key: 'contacts', label: 'Contatos',  icon: '＠' },
];

export function TabBar({ active, onChange }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            hitSlop={12}
            style={styles.tab}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  icon: {
    fontSize: 20,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  iconActive: { color: colors.ink },
  label: {
    fontSize: type.caption.fontSize,
    color: colors.textTertiary,
    fontFamily: fontFamily.inter,
  },
  labelActive: {
    color: colors.ink,
    fontWeight: '600',
    fontFamily: fontFamily.inter,
  },
});
