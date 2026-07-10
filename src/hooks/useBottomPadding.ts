import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const TAB_BAR_BASE_HEIGHT = 62;

export function useBottomPadding(hasTabBar = true): number {
  const insets = useSafeAreaInsets();
  if (hasTabBar) {
    return TAB_BAR_BASE_HEIGHT + insets.bottom;
  }
  return insets.bottom + 24;
}
