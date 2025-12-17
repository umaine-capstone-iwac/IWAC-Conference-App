import { StyleSheet, View, Text} from 'react-native';
import { Colors } from '@/constants/theme';
import {useState} from 'react';
import {Checkbox} from 'expo-checkbox';

export default function NotificationSettingsModal() {
    //The helper constants for the state of each checkbox. 
    const [isChecked1, setChecked1] = useState<boolean>(true);
    const [isChecked2, setChecked2] = useState<boolean>(true);
    const [isChecked3, setChecked3] = useState<boolean>(true);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.paragraph}>Message notifications </Text>
        <Checkbox style ={styles.checkbox} value={isChecked1} onValueChange={setChecked1}/>
      </View>
      <View style={styles.section}>
        <Text style={styles.paragraph}>Presentation updates </Text>
        <Checkbox style ={styles.checkbox} value={isChecked2} onValueChange={setChecked2}/>
      </View>
            <View style={styles.section}>
        <Text style={styles.paragraph}>Notify me of upcoming presentations</Text>
        <Checkbox style ={styles.checkbox} value={isChecked3} onValueChange={setChecked3}/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.awac.beige,
    padding: 20,
  },
  section:{
    flexDirection: 'row', 
    alignItems: 'center',
  },
  paragraph:{
    fontSize: 15,
  },
  checkbox: {
    margin: 8,
  },
});