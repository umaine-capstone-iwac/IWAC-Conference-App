import { View, Text, StyleSheet, TextInput, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from '@/components/themed-text';
import { Colors } from "@/constants/theme";
import {Input} from '@/components/input';
import {ProfilePicture} from '@/components/profile-picture';
import {router} from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {filterUsers} from "@/utils/filterUsers";
import { supabase } from "@/lib/supabase";

export default function SearchUsersScreen() {

  const [users, setUsers] = useState<{
    id: string;
    first_name: string | null;
    last_name: string | null;
  }[]>([]);

  const [search, setSearch] = useState("");

  // Fetch all users from database when component mounts
  useEffect(() => {
    const loadUsers= async () => {
      const {data, error} = await supabase
        .from('users')
        .select('id, first_name, last_name');

      if (error) {
        console.error("Error loading other user:", error);
        return;
      }
      setUsers(data);
      console.log(data);
    };
    loadUsers();
  }, []);

  // Filter the user list based on the search query
  const filteredUsers = useMemo(() => {
    return filterUsers(users, search);
  }, [users, search]);

  return (
    <SafeAreaView style={styles.container}>
        <Input 
          text = "Search users..." 
          style = {styles.searchBar} 
          onChangeText={setSearch}/>

        <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable 
                onPress={() => {
                  router.dismissAll(); 
                  router.push(`/conversation?otherUserID=${item.id}`);
                }} 
                style={styles.userRow}>
                  <ProfilePicture size={40} source={require('@/assets/images/profile-picture.png')} />
                  <Text style={styles.userText}>{item.first_name} {item.last_name}</Text>
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