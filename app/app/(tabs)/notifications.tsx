import { View, Text, StyleSheet, ScrollView, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from '@/components/themed-text';
import { Colors } from "@/constants/theme";
import {Input} from '@/components/input';
import {ProfilePicture} from '@/components/profile-picture';

// Dummy user names to be replaced later
const dummyNotifications = [
  { id: "1", text: "Lunch has been pushed back to 12:30 PM.", time: "36 mins ago", read : false },
  { id: "2", text: "Presentation 'AI in Education' has been moved to Neville 116.", time: "2 hours ago", read : false },
  { id: "3", text: "Missing wallet found in Neville 108, contact Brett Palmer for more information.", time: "4 hours ago", read : true},
  { id: "4", text: "Presentation 'Unlocking Creativity in the Classroom' has been cancelled.", time: "1 day ago", read: true},
];

export default function NewMessageScreen() {
  return (
    <ScrollView style={styles.container}>
        <FlatList
            data={dummyNotifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
            <Pressable style={styles.userRow}>
            <View style={styles.textContainer}>
                <Text 
                    numberOfLines={4} 
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
    </ScrollView>
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
    gap: 20,
    width: '100%'
  },
  textContainer: {
    flex: 1,        // text takes available space
    marginRight: 10, // spacing between text and time
},
  userText: {
    fontSize: 18,
    lineHeight: 24,
  },
  searchBar: {
    maxHeight: 50,     
    fontSize: 16,  
  }
});