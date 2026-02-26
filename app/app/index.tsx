import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Input } from '@/components/input';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      console.log('Email and password required');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Auth error:', error.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* <ThemedText type="title" style={styles.title}>Profile Settings</ThemedText> */}
        <ThemedText type="subtitle" style={styles.subtitle}>
          Login
        </ThemedText>
        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>
            Email
          </ThemedText>
          <Input
            text="email@address.com"
            onChangeText={(text) => setEmail(text)}
            autoCapitalize="none"
            style={styles.input}
          />
        </View>
        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>
            Password
          </ThemedText>
          <Input
            text="password"
            onChangeText={(text) => setPassword(text)}
            autoCapitalize="none"
            style={styles.input}
            secureTextEntry={true}
          />
        </View>
        <TouchableOpacity onPress={handleLogin}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Login</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/createAccount')}>
          <View style={styles.button2}>
            <Text style={styles.buttonText2}>Create Account</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: Colors.awac.beige,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    marginTop: 100,
    paddingBottom: 50,
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: 15,
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
  button: {
    backgroundColor: Colors.awac.orange,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  button2: {
    backgroundColor: Colors.awac.beige,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 20,
  },
  buttonText2: {
    color: 'mediumblue',
    fontSize: 14,
    fontWeight: '600',
  },
});
