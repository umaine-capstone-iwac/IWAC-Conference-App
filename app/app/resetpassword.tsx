import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/input';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';

export default function ResetPasswordScreen(): React.JSX.Element {
  // -- PARAMS -- //

  // URL passed from root layout deep link handler
  const { url } = useLocalSearchParams<{ url: string }>();

  // -- STATE -- //

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [sessionReady, setSessionReady] = useState(false);
  const [errorText, setErrorText] = useState('');

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
          setErrorText('Reset link is invalid or expired.');
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
    setErrorText('');

    // Verify both fields are filled
    if (!password || !confirmPassword) {
      setErrorText('Please fill in both fields.');
      return;
    }

    // Verify passwords match
    if (password !== confirmPassword) {
      setErrorText('Passwords do not match.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    // If failure, show error
    if (error) {
      console.error('Error updating password:', error.message);
      setErrorText(error.message);
      return;
    }

    // On success, sign out and return to login
    await supabase.auth.signOut();
    router.replace('/');
  };

  // -- UI -- //

  // Show loading state until session is verified
  if (!sessionReady) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <ThemedText style={styles.verifyingText}>
            Verifying reset link...
          </ThemedText>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>
            New Password
          </ThemedText>
          <Input
            text="password"
            onChangeText={setPassword}
            autoCapitalize="none"
            style={styles.input}
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>
            Confirm Password
          </ThemedText>
          <Input
            text="password"
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
            style={styles.input}
            secureTextEntry
          />
        </View>

        <TouchableOpacity onPress={handleResetPassword}>
          <View style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Update Password</Text>
          </View>
        </TouchableOpacity>

        {errorText && (
          <ThemedText style={styles.errorText}>{errorText}</ThemedText>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// -- STYLES -- //

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.awac.beige,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 24,
    marginTop: 50,
    paddingBottom: 30,
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: 15,
    marginHorizontal: '10%',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    backgroundColor: Colors.lightestBlue,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: Colors.awac.orange,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    paddingVertical: 15,
    paddingHorizontal: 40,
    alignSelf: 'center',
    justifyContent: 'center',
    fontSize: 16,
    minHeight: 50,
  },
  verifyingText: {
    alignSelf: 'center',
    fontSize: 16,
  },
});
