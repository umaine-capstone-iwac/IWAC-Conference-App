// -- INPUT COMPONENT -- //

// Wraps React Native TextInput with consistent styling

import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors } from '@/constants/theme';

// Extends default TextInput props with required placeholder text
export type InputProps = TextInputProps & {
  text: string;
};

export function Input({ text, style, ...rest }: InputProps) {
  return (
    <TextInput
      // Use provided text as placeholder
      placeholder={text}
      placeholderTextColor={Colors.darkGrey}
      // Merge base styles with any custom styles passed in
      style={[styles.input, style]}
      // Default behavior for sentence-style inputs
      autoCapitalize="sentences"
      // Forward remaining TextInput props
      {...rest}
    />
  );
}

// -- STYLES -- //

const styles = StyleSheet.create({
  input: {
    padding: 10,
    backgroundColor: Colors.lightestBlue,
    borderWidth: 2,
    borderColor: 'grey',
    borderRadius: 10,
    minHeight: 50,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});
