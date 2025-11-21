import { View, type ViewProps } from 'react-native';

import { Colors } from '@/constants/theme';

export function ThemedView({ style, ...otherProps }: ViewProps) {
  const backgroundColor = Colors.lightestBlue;
  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
