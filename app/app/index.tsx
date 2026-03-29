import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Input } from '@/components/input';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import ForgotPasswordModal from '@/app/modals/forgotPassword';

export default function LoginScreen() {
  // -- STATE -- //

  // User input state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Stops user from attempting multiple login calls
  const [isLoading, setIsLoading] = useState(false);

  // Error text state
  const [errorText, setErrorText] = useState('');

  // Forgot password modal visibility state
  const [forgotModalVisible, setForgotModalVisible] = useState(false);

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
      return { valid: false, message: 'Email not in registrants list' };

    return { valid: true, message: '' };
  };

  // -- LOGIN -- //

  // Attempt to log in user on button press
  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);

    // Verify both fields are entered
    if (!email || !password) {
      setErrorText('Email and password required');
      setIsLoading(false);
      return;
    }

    // Check that user is registered
    const result = await checkRegistrant(email);

    // Return if not registered
    if (!result.valid) {
      setErrorText(result.message);
      setIsLoading(false);
      return;
    }

    // Attempt to sign in with provided credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If failure, show error
    if (error) {
      console.error('Auth error:', error.message);
      setErrorText(
        'Incorrect password, or no account found.\nPlease verify password or create an account.',
      );
      setIsLoading(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setErrorText('Unable to retrieve user.');
      setIsLoading(false);
      return;
    }

    // Attempt to sign in user, and initialize tables if first login
    try {
      // Check if user row already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      // If user row doesn't exist, create it
      if (!existingUser) {
        // Add user row to 'users'
        await supabase.from('users').insert({
          id: user.id,
          first_name: user.user_metadata.first_name,
          last_name: user.user_metadata.last_name,
          admin: false,
        });

        // Add user row to 'profiles'
        await supabase.from('profiles').insert({
          id: user.id,
        });
      }
    } catch (err) {
      console.error('User setup error:', err);
    }

    // Enter the app
    router.replace('/(tabs)');
  };

  // -- UI -- //

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        {/* Login header */}
        <ThemedText type="subtitle" style={styles.subtitle}>
          Login
        </ThemedText>

        {/* Username input */}
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

        {/* Login Button*/}
        <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
          <View style={[styles.loginButton, { opacity: isLoading ? 0.5 : 1},]}>
            <Text style={styles.loginButtonText}>{isLoading ? 'Logging In...' : 'Login'}</Text>
          </View>
        </TouchableOpacity>

        {/* Error text, if any */}
        {errorText && (
          <ThemedText style={styles.errorText}>{errorText}</ThemedText>
        )}

        {/* Link to create account screen */}
        <TouchableOpacity onPress={() => router.replace('/createAccount')}>
          <View style={styles.linkButton}>
            <Text>New to the IWAC App?</Text>
            <Text style={styles.linkButtonText}>Create Account</Text>
          </View>
        </TouchableOpacity>

        {/* Opens forgot password modal */}
        <TouchableOpacity onPress={() => setForgotModalVisible(true)}>
          <View style={styles.linkButton}>
            <Text style={styles.linkButtonText}>Forgot Password?</Text>
          </View>
        </TouchableOpacity>

        {/* Forgot password modal */}
        <ForgotPasswordModal
          visible={forgotModalVisible}
          onClose={() => setForgotModalVisible(false)}
        />
      </View>
      {/* </KeyboardAvoidingView> */}
    </SafeAreaView>
  );
}

// -- STYLES -- //

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.awac.beige,
  },
  title: {
    fontSize: 28,
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
  loginButton: {
    backgroundColor: Colors.awac.orange,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    backgroundColor: Colors.awac.beige,
    alignSelf: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkButtonText: {
    marginTop: 10,
    color: 'mediumblue',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    marginTop: 5,
    paddingBottom: 15,
    paddingHorizontal: 15,
    alignSelf: 'center',
    fontSize: 16,
  },
});
