import { View, Text, StyleSheet, TextInput, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from '@/components/themed-text';
import { Colors } from "@/constants/theme";
import {Input} from '@/components/input';
import {ProfilePicture} from '@/components/profile-picture';
import {router} from "expo-router";

// Dummy user names to be replaced later
const dummyUsers = [
  { id: "1", name: "Shelly Smith" },
  { id: "2", name: "Jillian Moore" },
  { id: "3", name: "Javier Martínez" },
  { id: "4", name: "Marcus Johnson" },
];

export default function NewMessageScreen() {
  return (
    <SafeAreaView style={styles.container}>
        <Input text = "Search users..." style = {styles.searchBar}/>

        <FlatList
            data={dummyUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
            <Pressable 
              onPress={() => {
                router.dismissAll(); 
                router.push("/conversation");
              }} 
              style={styles.userRow}>
                <ProfilePicture size={40} source={require('@/assets/images/profile-picture.png')} />
                <Text style={styles.userText}>{item.name}</Text>
            </Pressable>
            )}
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.lightestBlue
  },
  userRow: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: Colors.lightBlue,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20
  },
  userText: {
    fontSize: 18,
  },
  searchBar: {
    maxHeight: 50,     
    fontSize: 16,  
  }
});