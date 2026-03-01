import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Input } from '@/components/input';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  //User input
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  //To toggle alert texts based on user input
  const [isVisibile, setIsVisibile] = useState(false); //No text in email or password input
  const [isVisibile2, setIsVisibile2] = useState(false); //Email not in 'users_registered' table in supabase database
  const [isVisibile3, setIsVisibile3] = useState(false); //Error logging in, or database related

  //When login button is pressed this function is called
  const handleLogin = async () => {
    setIsVisibile(false);
    setIsVisibile2(false);
    setIsVisibile3(false);

    //Checks user input
    if (!email || !password) {
      console.log('Email and password required');
      setIsVisibile(true);
      return;
    } else {
      //Checks that user entered email is within 'users_registered' table in supabase database
      const { count, error } = await supabase
        .from('users_registered')
        .select('email', { count: 'exact', head: true })
        .eq('email', email);

      if (error) {
        console.log('Error searching for email', error);
        setIsVisibile3(true);
        return;
      }

      //if count = 1 then true, if count = 0 then no email was found in table
      if (count !== null && count !== undefined) {
        if (count === 0) {
          console.log('Email not in registrants list');
          setIsVisibile2(true);
          return;
        } else if (count > 1) {
          console.log('Error more than one account');
          setIsVisibile3(true);
          return;
        }
      }
    }

    //Signs user up on supabase
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Auth error:', error.message);
      setIsVisibile3(true);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Login
        </ThemedText>

        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>
            Email
          </ThemedText>
          <Input
            text="email@address.com"
            onChangeText={setEmail}
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
            onChangeText={setPassword}
            autoCapitalize="none"
            style={styles.input}
            secureTextEntry
          />
        </View>

        <TouchableOpacity onPress={handleLogin}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Login</Text>
          </View>
        </TouchableOpacity>

        {isVisibile && <ErText />}
        {isVisibile2 && <ErText2 />}
        {isVisibile3 && <ErText3 />}

        <TouchableOpacity onPress={() => router.replace('/createAccount')}>
          <View style={styles.button2}>
            <Text>New to the IWAC App?</Text>
            <Text style={styles.buttonText2}>Create Account</Text>
          </View>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const ErText = () => {
  return (
    <ThemedText
      style={{
        color: 'red',
        marginTop: 5,
        paddingBottom: 15,
        alignSelf: 'center',
        fontSize: 16,
      }}
    >
      Email and password required
    </ThemedText>
  );
};

const ErText2 = () => {
  return (
    <ThemedText
      style={{
        color: 'red',
        marginTop: 5,
        paddingBottom: 15,
        alignSelf: 'center',
        fontSize: 16,
      }}
    >
      Email not in registrants list
    </ThemedText>
  );
};
const ErText3 = () => {
  return (
    <ThemedText
      style={{
        color: 'red',
        marginTop: 5,
        paddingBottom: 15,
        alignSelf: 'center',
        fontSize: 16,
      }}
    >
      Error logging in, ensure email and password are entered correctly
    </ThemedText>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.awac.beige,
  },
  content: {
    flex: 1,
    justifyContent: 'center', // vertical center
    padding: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 10,
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
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText2: {
    marginTop: 10,
    color: 'mediumblue',
    fontSize: 14,
    fontWeight: '600',
  },
});
