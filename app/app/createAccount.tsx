import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themedText';
import { Input } from '@/components/input';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import AlertModal from '@/app/modals/alert';

export default function CreateAccount() {
  // -- STATE -- //

  // User input state
  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passCheck, setPassCheck] = useState('');

  // Stops user from attempting multiple create account calls
  const [isLoading, setIsLoading] = useState(false);

  // Error text state
  const [errorText, setErrorText] = useState('');

  // Alert modal visibility state
  const [alertModalVisible, setAlertModalVisible] = useState(false);

  // -- AUTHENTICATION HELPERS -- //

  // Check if an email is registered for the conference
  const checkRegistrant = async (email: string) => {
    const { count, error } = await supabase
      .from('users_registered')
      .select('email', { count: 'exact', head: true })
      .eq('email', email);

    if (error)
      return { valid: false, message: 'Error checking registrants list' };
    if (!count || count === 0)
      return {
        valid: false,
        message:
          'This email is not registered for the IWAC conference. Please contact the admin.',
      };

    return { valid: true, message: '' };
  };

  // -- CREATE ACCOUNT -- //

  const handleCreateAccount = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setErrorText('');

    // Verify all fields are entered
    if (!email || !password || !passCheck) {
      setErrorText('Email and password required');
      setIsLoading(false);
      return;
    } else if (!fName || !lName) {
      setErrorText('First and last name required');
      setIsLoading(false);
      return;
    }

    // Verify password length
    if (password.length < 6 || passCheck.length < 6) {
      setErrorText('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    // Verify passwords match
    if (passCheck !== password) {
      setErrorText('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Check that user is registered
    const result = await checkRegistrant(email);
    if (!result.valid) {
      setErrorText(result.message);
      setIsLoading(false);
      return;
    }

    // Attempt to create account with provided credentials
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'iwacapp://login',
        data: { first_name: fName, last_name: lName },
      },
    });

    // If failure, show error
    if (error) {
      console.error('Auth error:', error.message);
      setErrorText('Error creating account, please try again');
      setIsLoading(false);
      return;
    }

    // If user already exists, show error.
    if (
      data.user &&
      data.user.identities &&
      data.user.identities.length === 0
    ) {
      setErrorText('An IWAC App account already exists with this email.');
      setIsLoading(false);
      return;
    }

    setAlertModalVisible(true);
  };

  // -- UI -- //

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView>
          {/* Create account header */}
          <ThemedText type="subtitle" style={styles.subtitle}>
            Create Account
          </ThemedText>

          {/* First name input */}
          <View style={styles.inputGroup}>
            <ThemedText type="title" style={styles.label}>
              First Name
            </ThemedText>
            <Input
              text="First Name"
              onChangeText={setFName}
              autoCapitalize="none"
            />
          </View>

          {/* Last name input */}
          <View style={styles.inputGroup}>
            <ThemedText type="title" style={styles.label}>
              Last Name
            </ThemedText>
            <Input
              text="Last Name"
              onChangeText={setLName}
              autoCapitalize="none"
            />
          </View>

          {/* Email input */}
          <View style={styles.inputGroup}>
            <ThemedText type="title" style={styles.label}>
              Email
            </ThemedText>
            <Input
              text="email@address.com"
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          {/* Password input */}
          <View style={styles.inputGroup}>
            <ThemedText type="title" style={styles.label}>
              Password
            </ThemedText>
            <Input
              text="password"
              onChangeText={setPassword}
              autoCapitalize="none"
              secureTextEntry
            />
          </View>

          {/* Confirm password input */}
          <View style={styles.inputGroup}>
            <ThemedText type="title" style={styles.label}>
              Confirm Password
            </ThemedText>
            <Input
              text="password"
              onChangeText={setPassCheck}
              autoCapitalize="none"
              secureTextEntry
            />
          </View>

          {/* Create account button */}
          <TouchableOpacity onPress={handleCreateAccount} disabled={isLoading}>
            <View
              style={[styles.createButton, { opacity: isLoading ? 0.5 : 1 }]}
            >
              <Text style={styles.createButtonText}>
                {' '}
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Error text, if any */}
          {errorText && (
            <ThemedText style={styles.errorText}>{errorText}</ThemedText>
          )}

          {/* Link to Login */}
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <View style={styles.linkButton}>
              <Text>Already have an account?</Text>
              <Text style={styles.linkButtonText}>Go to Login</Text>
            </View>
          </TouchableOpacity>

          {/* Alert modal, if visible */}
          <AlertModal
            visible={alertModalVisible}
            title="Email Sent"
            message="Check your inbox and spam for a verification link.\n\nOnce verified, return to the app and log in."
            onClose={() => {
              setAlertModalVisible(false);
              // Reroute to Login on Alert close
              router.replace('/login');
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// -- STYLES -- //

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.awac.beige,
  },
  subtitle: {
    fontSize: 24,
    marginTop: 25,
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
  createButton: {
    backgroundColor: Colors.awac.orange,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 20,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    backgroundColor: Colors.awac.beige,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  linkButtonText: {
    marginTop: 10,
    color: 'mediumblue',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    marginTop: 5,
    paddingBottom: 5,
    marginHorizontal: 10,
    textAlign: 'center',
    fontSize: 16,
  },
});
