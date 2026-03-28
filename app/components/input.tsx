// -- INPUT COMPONENT -- //

// Wraps React Native TextInput with consistent styling

import {
  View,
  ViewStyle,
  TextInput,
  StyleSheet,
  TextInputProps,
  Pressable,
} from 'react-native';
import { useState } from 'react';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

// -- PROPS -- //

// Extends default TextInput props with required placeholder text
export type InputProps = TextInputProps & {
  text: string;
  style?: ViewStyle;
};

export function Input({ text, style, secureTextEntry, ...rest }: InputProps) {
  // -- STATE -- //
  const isPassword = secureTextEntry;
  const [isVisible, setIsVisible] = useState(secureTextEntry);

  // -- UI -- //

  return (
    <View style={[styles.container, style]}>
      <TextInput
        // Use provided text as placeholder
        placeholder={text}
        placeholderTextColor={Colors.darkGrey}
        // Merge base styles with any custom styles passed in
        style={styles.input}
        // Default behavior for sentence-style inputs
        autoCapitalize="sentences"
        // Hide text entry if isVisible set to false
        secureTextEntry={isVisible}
        // Have done key, unless multiline
        returnKeyType={rest.multiline ? 'default' : 'done'}
        // Forward remaining TextInput props
        {...rest}
      />
      {isPassword && (
        <Pressable
          style={styles.visibilityButton}
          onPress={() => setIsVisible(!isVisible)}
          hitSlop={12}
        >
          <IconSymbol
            size={25}
            name={isVisible ? 'eye.slash' : 'eye'}
            color={Colors.awac.navy}
            style={styles.visibilityIcon}
          />
        </Pressable>
      )}
    </View>
  );
}

// -- STYLES -- //

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  input: {
    padding: 10,
    backgroundColor: Colors.lightestBlue,
    borderWidth: 2,
    borderColor: 'grey',
    borderRadius: 10,
    minHeight: 50,
    fontSize: 16,
    textAlignVertical: 'center',
    flex: 1,
  },
  visibilityIcon: {
    position: 'absolute',
    right: 15,
  },
  visibilityButton: {
    justifyContent: 'center',
  },
});
