import { Platform } from 'react-native';

export const Colors = {
  text: '#11181C',
  lightestBlue: '#eff7fcff',
  lightBlue: '#c4e8fcff',
  blue: '#3899d5ff',
  darkBlue: '#155278ff',
  darkestBlue: '#031a34ff',
  //UMaine Custom Colors
  umaine: {
    lightBlue: '#79BDE8',
    darkBlue: '#082E58',
  },
  //AWAC Custom
  awac: {
    beige: '#f3ebdc',
    navy: '#22477a',
    lightBlue: '#76bccf',
    orange: '#fb9949'
  }
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
