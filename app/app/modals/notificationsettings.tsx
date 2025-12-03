import { ScrollView, StyleSheet, View, TextInput, Text, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Input } from '@/components/input';
import { ProfilePicture } from '@/components/profile-picture';
import { Colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import {useState, ChangeEvent} from 'react';

export default function NotificationSettingsModal() {
    //The helper constants for the state of each checkbox. 
    const [isChecked1, setIsChecked1] = useState<boolean>(true);
    const [isChecked2, setIsChecked2] = useState<boolean>(true);
    const [isChecked3, setIsChecked3] = useState<boolean>(true);
    const handleChange1 = (event: ChangeEvent<HTMLInputElement>) => {setIsChecked1(event.target.checked)};
    const handleChange2 = (event: ChangeEvent<HTMLInputElement>) => {setIsChecked2(event.target.checked)};
    const handleChange3 = (event: ChangeEvent<HTMLInputElement>) => {setIsChecked3(event.target.checked)};

  return (
    <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* <ThemedText type="title" style={styles.title}>Notification Settings</ThemedText> */}
        <ThemedText type="subtitle" style={styles.subtitle}>Manage your notification preferences below:</ThemedText>

        <input type = "checkbox" id = "Email Notifications" checked = {isChecked1} onChange = {handleChange1}/>
        <Text>Email notifications: {isChecked1 ? 'Checked' : 'Unchecked'}</Text>

        <input type = "checkbox" id = "Push Notifications" checked = {isChecked2} onChange = {handleChange2}/>
        <Text>Push notifications: {isChecked2 ? 'Checked' : 'Unchecked'}</Text>

        <input type = "checkbox" id = "SMS Notifications" checked = {isChecked3} onChange = {handleChange3}/>
        <Text>SMS notifications: {isChecked3 ? 'Checked' : 'Unchecked'}</Text>

        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.awac.beige,
    padding: 20,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.umaine.darkBlue,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 18,
    marginBottom: 5,
  },
  input: {
    backgroundColor: Colors.awac.lightBlue,
    borderRadius: 5,
    padding: 10,
  },
});