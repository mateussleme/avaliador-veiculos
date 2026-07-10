import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme/tokens';

// Altura base do TabBar (sem a área segura inferior).
// Atualizar aqui se mudar o layout do TabBar.
export const TAB_BAR_HEIGHT = 62;

interface ScreenScrollViewProps {
  children: ReactNode;
  // true nas telas onde o TabBar aparece (Avaliar e Histórico - lista)
  hasTabBar?: boolean;
  // padding extra customizado além do safe area automático
  extraBottomPadding?: number;
  contentContainerStyle?: ViewStyle;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
}

/**
 * ScrollView com padding inferior automático que considera:
 * - Barra de navegação por gestos do Android
 * - Home indicator do iPhone
 * - Altura do TabBar (quando visível)
 *
 * Substitua `ScrollView` por `ScreenScrollView` em qualquer tela
 * e os botões na parte inferior nunca mais vão ficar escondidos.
 */
export function ScreenScrollView({
  children,
  hasTabBar = false,
  extraBottomPadding = 0,
  contentContainerStyle,
  keyboardShouldPersistTaps = 'handled',
}: ScreenScrollViewProps) {
  const insets = useSafeAreaInsets();

  const bottomPadding =
    insets.bottom +
    (hasTabBar ? TAB_BAR_HEIGHT : 0) +
    spacing.xl +
    extraBottomPadding;

  return (
    <ScrollView
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      contentContainerStyle={[
        styles.base,
        { paddingBottom: bottomPadding },
        contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  base: {
    padding: spacing.lg,
  },
});
