import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen(): React.JSX.Element {
  const [password, setPassword] = useState<string>('');

  const handleResetPassword = async (): Promise<void> => {
    if (!password) {
      Alert.alert('Error', 'Please enter a new password');
      console.log('Error', 'Please enter a new password');
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
        Alert.alert('Error', error.message);
        console.log('Error updating password', error.message);
    } else {
      Alert.alert('Success', 'Password updated successfully');
      console.log('Success', 'Password updated successfully');
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Enter new password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <Button title="Update Password" onPress={handleResetPassword} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    borderRadius: 6,
  },
})