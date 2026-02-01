import { View, Text, StyleSheet, TextInput, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from '@/components/themed-text';
import { Colors } from "@/constants/theme";
import {Input} from '@/components/input';
import {ProfilePicture} from '@/components/profile-picture';
import {router} from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase';

export default function NewMessageScreen() {

  const [users, setUsers] = useState<{
    id: string;
    first_name: string | null;
    last_name: string | null;
  }[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name');
      // console.log('[loadUsers] data:', data);
      if (!error) {
        setUsers(data);
      } else {
        console.error(error);
      }
    };

    loadUsers();
  }, []);
  return (
    <SafeAreaView style={styles.container}>
        <Input text = "Search users..." style = {styles.searchBar}/>

        <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
            <Pressable 
              onPress={() => {
                router.dismissAll(); 
                router.push("/conversation");
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