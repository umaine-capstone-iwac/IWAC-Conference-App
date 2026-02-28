import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Input } from '@/components/input';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CreateAccount() {
  //User input
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passCheck, setPassCheck] = useState('');
  //const[toggleVisibility, setToggleVisibility] = useState(true);

  //When create account or login button is pressed this function is called
  const handleSignIn = async () => {
    //Checks user input
    if (!email || !password) {
      console.log('Email and password required');
      return;
    } else if (passCheck !== password) {
      console.log('Your passwords do not match');
      return;
    }
    //Checks that user entered email is within 'users_registered' table in supabase database
    const { count, error } = await supabase
      .from('users_registered')
      .select('Email', { count: 'exact', head: true })
      .eq('Email', email)
      .limit(1);

    //if count > 0 then true, if count = 0 then no email was found in table
    if (count !== null && count !== undefined) {
      if (count === 0) {
        console.log('Email not in registrants list');
        return;
      } else if (count === 1) {
        if (error) {
          console.log('Error searching for email', error);
          return;
        } else {
          const { error } = await supabase.auth.signUp({
            email,
            password,
          });
          if (error) {
            console.error('Auth error:', error.message);
          } else {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              await supabase
                .from('users')
                .insert({ id: user.id, first_name: name, admin: false });
              await supabase.from('profiles').insert({ id: user.id });
            }
            router.replace('/(tabs)');
          }
        }
      } else if (count > 1) {
        console.log('More than one account found...');
        return;
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* <ThemedText type="title" style={styles.title}>Profile Settings</ThemedText> */}
        <ThemedText type="subtitle" style={styles.subtitle}>
          Create Account
        </ThemedText>
        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>
            Name
          </ThemedText>
          <Input
            text="Name"
            onChangeText={(text) => setName(text)}
            autoCapitalize="none"
            style={styles.input}
          />
        </View>
        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>
            Email
          </ThemedText>
          <Input
            text="Email"
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
            text="Password"
            onChangeText={(text) => setPassword(text)}
            autoCapitalize="none"
            style={styles.input}
            secureTextEntry={true}
          />
        </View>
        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>
            Confirm Password
          </ThemedText>
          <Input
            text="Password"
            onChangeText={(text) => setPassCheck(text)}
            autoCapitalize="none"
            style={styles.input}
            secureTextEntry={true}
          />
        </View>
        <TouchableOpacity onPress={handleSignIn}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Login</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.replace('/')} //Reroutes to login screen or index.tsx file in (tabs) folder
        >
          <View style={styles.button2}>
            <Text> Already have an account?</Text>
            <Text style={styles.buttonText2}>Login</Text>
          </View>
          <Text style={styles.alertText1}>Your passwords do not match</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginTop: 25,
    paddingBottom: 50,
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
  alertText1: {
    color: 'red',
    alignSelf: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
