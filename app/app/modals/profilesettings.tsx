import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Input } from '@/components/input';
import { Colors } from '@/constants/theme';

export default function ProfileSettingsModal() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* <ThemedText type="title" style={styles.title}>Profile Settings</ThemedText> */}
        <ThemedText type="subtitle" style={styles.subtitle}>Edit your profile information below:</ThemedText>
        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>Name</ThemedText>
          <Input text="John Doe" style={styles.input} />
        </View>
        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>Bio</ThemedText>
          <Input text="PenUltimate CEO" style={styles.input} />
        </View>
        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>About Me</ThemedText>
          <Input text="Hello! I'm John, a software developer with a love for creating intuitive and dynamic user experiences." style={styles.input} multiline />
        </View>
        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>Interests</ThemedText>
          <Input text="- Coding and Software Development\n- Hiking and Nature Walks\n- Photography and Visual Arts\n- Traveling and Exploring New Cultures" style={styles.input} multiline />
        </View>
        <TouchableOpacity>
          <View style = {styles.button}>
            <Text style={styles.buttonText}>Save Changes</Text>
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
    marginBottom: 20,
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
  }
});