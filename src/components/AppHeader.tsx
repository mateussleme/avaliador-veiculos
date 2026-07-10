import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, type } from '../theme/tokens';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onPrivacy?: () => void;
}

export function AppHeader({ title, subtitle, onBack, onPrivacy }: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={20} style={styles.sideButton}>
            <Text style={styles.backArrow}>{'←'}</Text>
          </Pressable>
        ) : (
          <View style={styles.sideButton} />
        )}

        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>

        {onPrivacy ? (
          <Pressable onPress={onPrivacy} hitSlop={20} style={styles.sideButton}>
            <Text style={styles.privacyLink}>Privacidade</Text>
          </Pressable>
        ) : (
          <View style={styles.sideButton} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backArrow: {
    color: colors.textOnInk,
    fontSize: 26,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: colors.textOnInk,
    fontSize: type.h2.fontSize,
    fontWeight: type.h2.fontWeight,
  },
  subtitle: {
    color: colors.textOnInk,
    opacity: 0.7,
    fontSize: type.caption.fontSize,
    marginTop: 2,
  },
  privacyLink: {
    color: colors.textOnInk,
    opacity: 0.85,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
});
