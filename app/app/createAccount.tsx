import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Input } from '@/components/input';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';

export default function createAccount() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* <ThemedText type="title" style={styles.title}>Profile Settings</ThemedText> */}
        <ThemedText type="subtitle" style={styles.subtitle}>Enter Name, Email, and Password</ThemedText>
        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>Name</ThemedText>
          <Input text="Name" style={styles.input} />
        </View>
        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>Email</ThemedText>
          <Input text="Email" style={styles.input} />
        </View>
        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>Password</ThemedText>
          <Input text="Password" style={styles.input} />
        </View>
        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>Confirm Password</ThemedText>
          <Input text="Password" style={styles.input} />
        </View>
        <TouchableOpacity 
            onPress={() => router.replace("/(tabs)")}
        >
            <View style = {styles.button}>
                <Text style={styles.buttonText}>Login</Text>
            </View>
        </TouchableOpacity>
        <TouchableOpacity>
                  <View style = {styles.button2}>
                    <Text style={styles.buttonText2}>Already Have an Account. Go to Login Screen.</Text>
                  </View>
                </TouchableOpacity>
        </ScrollView>
      </View>
      
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
    fontSize: 18,
    marginTop: 20,
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
    color: "white",
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
    color: "black",
    fontSize: 14,
    fontWeight: '600',
  }
});