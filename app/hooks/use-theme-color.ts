/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';

// Simplified hook for a flat, light-only palette.
// Accepts an optional `light` or `color` override but otherwise returns the
// color from the global `Colors` object.
export function useThemeColor(
  props: { light?: string; dark?: string; color?: string },
  colorName: keyof typeof Colors
) {
  const colorFromProps = props.light ?? props.color;

  if (colorFromProps) {
    return colorFromProps;
  }

  return Colors[colorName];
}
