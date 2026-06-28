import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, type } from '../theme/tokens';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onPrivacy?: () => void;
}

export function AppHeader({ title, subtitle, onBack, onPrivacy }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.sideButton}>
            <Text style={styles.backArrow}>{'←'}</Text>
          </Pressable>
        ) : (
          <View style={styles.sideButton} />
        )}

        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {onPrivacy ? (
          <Pressable onPress={onPrivacy} hitSlop={12} style={styles.sideButton}>
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
    minWidth: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backArrow: {
    color: colors.textOnInk,
    fontSize: 22,
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
