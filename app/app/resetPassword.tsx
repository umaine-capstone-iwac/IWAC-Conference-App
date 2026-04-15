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
import AlertModal from '@/app/modals/alert';

export default function ResetPasswordScreen(): React.JSX.Element {
  // -- PARAMS -- //

  // URL passed from root layout deep link handler
  const { url } = useLocalSearchParams<{ url: string }>();

  // -- STATE -- //

  // Supabase session readiness state
  const [sessionReady, setSessionReady] = useState(false);

  // User input state
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Error text state
  const [errorText, setErrorText] = useState('');

  // Alert visibility state
  const [alertModalVisible, setAlertModalVisible] = useState(false);

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

  // -- UPDATE PASSWORD -- //

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

    // Verify password length
    if (password.length < 6 || confirmPassword.length < 6) {
      setErrorText('Password must be at least 6 characters');
      return;
    }

    // Attempt to update the user's password
    const { error } = await supabase.auth.updateUser({ password });

    // If failure, show error
    if (error) {
      console.error('Error updating password:', error.message);
      setErrorText(error.message);
      return;
    }

    // On success, sign out and return to login
    await supabase.auth.signOut();
    setAlertModalVisible(true);
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
            secureTextEntry
          />
        </View>

        <TouchableOpacity onPress={handleResetPassword}>
          <View style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Update Password</Text>
          </View>
        </TouchableOpacity>

        <ThemedText style={styles.errorText}>{errorText}</ThemedText>

        {/* Alert modal, if visible */}
        <AlertModal
          visible={alertModalVisible}
          title="Password Updated"
          message="You may now log in with your updated password."
          onClose={() => {
            setAlertModalVisible(false);
            // Reroute to Login on Alert close
            router.replace('/login');
          }}
        />
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
    paddingVertical: 10,
    paddingHorizontal: 40,
    alignSelf: 'center',
    justifyContent: 'center',
    fontSize: 16,
    minHeight: 40,
  },
  verifyingText: {
    alignSelf: 'center',
    fontSize: 16,
  },
});
