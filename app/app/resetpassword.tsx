import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen(): React.JSX.Element {
  // -- PARAMS -- //

  // URL passed from root layout deep link handler
  const { url } = useLocalSearchParams<{ url: string }>();

  // -- STATE -- //

  const [password, setPassword] = useState<string>('');
  const [sessionReady, setSessionReady] = useState(false);

  // -- SESSION INITIALIZATION -- //

  // Parse tokens from URL hash fragment and establish Supabase session
  useEffect(() => {
    const initializeSession = async () => {
      if (!url) {
        return;
      }

      // Decode the URL passed as a nav param from _layout.tsx
      const rawUrl = decodeURIComponent(url);

      const hashIndex = rawUrl.indexOf('#');
      if (hashIndex === -1) {
        return;
      }

      // Parse hash fragment into key/value pairs
      const hash = rawUrl.substring(hashIndex + 1);
      const params = new URLSearchParams(hash);

      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      // Establish session so updateUser() has auth context
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          console.error('Session error:', error.message);
          Alert.alert('Error', 'Reset link is invalid or expired.');
        } else {
          setSessionReady(true);
        }
      }
    };

    initializeSession();
  }, [url]);

  // -- DATA UPLOADING -- //

  // Update the user's password in Supabase
  const handleResetPassword = async (): Promise<void> => {
    if (!password) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      Alert.alert('Error', error.message);
      console.log('Error updating password', error.message);
    } else {
      Alert.alert('Success', 'Password updated successfully');
      await supabase.auth.signOut();
    }
  };

  // -- UI -- //

  // Show loading state until session is verified
  if (!sessionReady) {
    return (
      <View style={styles.container}>
        <Text>Verifying reset link...</Text>
      </View>
    );
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
  );
}

// -- STYLES -- //

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  input: { borderWidth: 1, padding: 12, marginBottom: 16, borderRadius: 6 },
});
