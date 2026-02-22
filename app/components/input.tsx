import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors } from '@/constants/theme';

export type InputProps = TextInputProps & {
  text: string;
};

export function Input({ text, style, ...rest }: InputProps) {
  return (
    <TextInput
      placeholder={text}
      placeholderTextColor={Colors.darkGrey}
      style={[styles.input, style]}  
      autoCapitalize = "sentences"
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 10,
    backgroundColor: Colors.lightestBlue,
    borderWidth: 2,
    borderColor: 'grey',
    borderRadius: 10,
    minHeight: 50,     
    fontSize: 16,    
    textAlignVertical:"top"
  },
});