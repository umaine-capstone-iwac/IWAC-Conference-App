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
  // -- STATE -- //

  // -- DERIVED DATA -- //
  //User input
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passCheck, setPassCheck] = useState('');

  //To toggle alert texts based on user input
  const [isVisibile, setIsVisibile] = useState(false); //No text in email or password box
  const [isVisibile2, setIsVisibile2] = useState(false); //Password < 6 characters
  const [isVisibile3, setIsVisibile3] = useState(false); //Password != confirmation password
  const [isVisibile4, setIsVisibile4] = useState(false); //Email not in 'users_registered' table in supabase database
  const [isVisibile5, setIsVisibile5] = useState(false); //Errors related to database, signing up user, searching for user, etc

  //When create account or login button is pressed this function is called
  const handleSignIn = async () => {
    setIsVisibile(false);
    setIsVisibile2(false);
    setIsVisibile3(false);
    setIsVisibile4(false);
    setIsVisibile5(false);

    //Checks user input
    if (!email || !password) {
      console.log('Email and password required');
      setIsVisibile(true);
      return;
    } else if (password.length < 6) {
      console.log('Password too short');
      setIsVisibile2(true);
      return;
    } else if (passCheck !== password) {
      console.log('Your passwords do not match');
      setIsVisibile3(true);
      return;
    }

    // -- Searching Database -- //
    //Checks that user entered email is within 'users_registered' table in supabase database
    const { count, error } = await supabase
      .from('users_registered')
      .select('email', { count: 'exact', head: true })
      .eq('email', email);

    //if count = 1 then true, if count = 0 then no email was found in table
    if (count !== null && count !== undefined) {
      if (count === 0) {
        console.log('Email not in registrants list');
        setIsVisibile4(true);
        return;
      } else if (count === 1) {
        if (error) {
          console.log('Error searching for email', error);
          setIsVisibile5(true);
          return;
        } else {
          // -- AUTH INITIALIZATION -- //
          const { error } = await supabase.auth.signUp({
            email,
            password,
          });
          if (error) {
            console.error('Auth error:', error.message);
            setIsVisibile5(true);
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
        setIsVisibile5(true);
        return;
      }
    }
  };

  // -- UI -- //
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* <ThemedText type="title" style={styles.title}>Profile Settings</ThemedText> */}
        <ThemedText type="subtitle" style={styles.subtitle}>
          Create Account
        </ThemedText>
        {isVisibile ? <ErText /> : null}
        {isVisibile2 ? <ErText2 /> : null}
        {isVisibile3 ? <ErText3 /> : null}
        {isVisibile4 ? <ErText4 /> : null}
        {isVisibile5 ? <ErText5 /> : null}
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
            <Text> Already have an Account?</Text>
            <Text style={styles.buttonText2}>Go to Login Screen</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const ErText = () => {
  return (
    <ThemedText style={styles.errorText}>
      No email or password entered
    </ThemedText>
  );
};

const ErText2 = () => {
  return (
    <ThemedText style={styles.errorText}>
      Passwords must be at least 6 characters
    </ThemedText>
  );
};
const ErText3 = () => {
  return (
    <ThemedText style={styles.errorText}>
      Your passwords do not match
    </ThemedText>
  );
};
const ErText4 = () => {
  return (
    <ThemedText style={styles.errorText}>
      Email not in registrants list
    </ThemedText>
  );
};
const ErText5 = () => {
  return (
    <ThemedText style={styles.errorText}>
      System error please ensure all information is correct and try again
    </ThemedText>
  );
};

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
  errorText: {
    color: 'red',
    marginTop: 5,
    paddingBottom: 15,
    alignSelf: 'center',
    fontSize: 16,
  },
});
