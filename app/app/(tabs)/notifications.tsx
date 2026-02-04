import { View, Text, StyleSheet, FlatList, Pressable, Platform, Linking} from "react-native";
import { Colors } from "@/constants/theme";
import { router } from 'expo-router';

// Dummy user names to be replaced later
const dummyNotifications = [
  { id: "1", text: "Lunch has been pushed back to 12:30 PM.", time: "36 mins ago", read : false },
  { id: "2", text: "Presentation 'AI in Education' has been moved to Neville 116.", time: "2 hours ago", read : false },
  { id: "3", text: "Missing wallet found in Neville 108, contact Brett Palmer for more information.", time: "4 hours ago", read : true},
  { id: "4", text: "Presentation 'Unlocking Creativity in the Classroom' has been cancelled.", time: "1 day ago", read: true},
];

export default function NewMessageScreen() {
  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };
  return (
    <View style={styles.container}>
            {/* Heather wanted manage notifications to just go to native settings */}
            <Pressable onPress={openSettings}>
              <View style = {styles.button}>
                <Text style={styles.buttonText}>Manage Notifications</Text>
              </View>
            </Pressable>
        <FlatList
            data={dummyNotifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable style={styles.userRow}>
              <View style={styles.textContainer}>
                  <Text 
                      numberOfLines={3} 
                      ellipsizeMode="tail" 
                      style={[styles.userText, !item.read && {fontWeight: 'bold'}]}
                  >
                  {item.text}
                  </Text>
              </View>
              <Text style={styles.userText}>{item.time}</Text>
              </Pressable>
            )}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.awac.beige
  },
  userRow: {
    padding: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderRadius: 15,
    borderColor: Colors.awac.navy,
    backgroundColor: Colors.lightestBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
    width: '100%'
  },
  textContainer: {
    flex: 1,       
},
  userText: {
    fontSize: 18,
    lineHeight: 24,
  },
  button: {
    backgroundColor: Colors.umaine.darkBlue,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: Colors.awac.beige,
    fontSize: 14,
    fontWeight: '600',
  }
});