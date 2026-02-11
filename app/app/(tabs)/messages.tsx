import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { ProfilePicture} from '@/components/profile-picture';
import { ThemedText } from '@/components/themed-text';
import { useEffect, useState } from "react";
import {Input} from '@/components/input';
import { Colors } from '@/constants/theme';
import {router} from "expo-router";
import { supabase } from '@/lib/supabase';
import {filterMessages} from "@/utils/filterMessages";

export default function MessagesListScreen() {
  const [userID, setUserID] = useState<string>();
  const [conversationUsers, setConversationUsers] = useState<{ 
    id: string; 
    first_name: string | null; 
    last_name: string | null; 
    lastMessage: string | null; 
    timestamp: string | null }[]
  >([]);
  const [search, setSearch] = useState("");
  
  // Fetch the logged in user's ID
  useEffect(() => {
    const loadUser = async () => {
      setUserID((await supabase.auth.getSession()).data.session?.user.id);
    };
    loadUser();
    // console.log("User ID: ", userID);
  }, []);

  useEffect(() => {
    if (!userID) return;

    const loadConversations = async () => {
      // Fetch all messages involving the current user
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, user_id, recipient_id, content, timestamp')
        .or(`user_id.eq.${userID},recipient_id.eq.${userID}`)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error("Error loading messages:", error);
        return;
      }

      // console.log("Messages:", messages);
      
      // Extract unique other user IDs
      const otherUserIds = Array.from(
        new Set(
          messages.map(msg =>
            msg.user_id === userID ? msg.recipient_id : msg.user_id
          )
        )
      );
      console.log(otherUserIds);

      // Fetch the corresponding user info
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', otherUserIds);

      if (usersError || !usersData) {
        console.error('Error fetching users:', usersError);
        return;
      }
      console.log(usersData);

      // Attach last message & timestamp
      const usersWithLastMessage = usersData.map(user => {
        const lastMsg = messages.find(
          msg =>
            msg.user_id === user.id || msg.recipient_id === user.id
        );
        return {
          ...user,
          lastMessage: lastMsg?.content ?? null,
          timestamp: lastMsg?.timestamp ?? null,
        };
      });

      setConversationUsers(usersWithLastMessage);
    };

    loadConversations();
  }, [userID]);

  const filteredUsers = filterMessages(conversationUsers, search);

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.messagesContainer}>
        <View style={styles.searchBarContainer}>
          <Input
            text="Search for a message..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchBar}
          />
          <View style={styles.searchIcon}>
            <Pressable onPress={() => router.push("/modals/search-users")}>
              <Text style={{ fontWeight: "bold", fontSize: 24 }}> + </Text>
            </Pressable>
          </View>
        </View>

        {filteredUsers.map(user => (
          <Pressable
            key={user.id}
            onPress={() => router.push(`/conversation?otherUserID=${user.id}`)}
          >
            <View style={styles.messageContainer}>
              <ProfilePicture size={40} source={require('@/assets/images/profile-picture.png')} />
              <View>
                <ThemedText type="title" style={{ fontSize: 22 }}>
                  {user.first_name} {user.last_name}
                </ThemedText>
                <ThemedText numberOfLines={1}>{user.lastMessage}</ThemedText>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContainer: {
    backgroundColor: Colors.awac.beige
  },
  messagesContainer: {
    flexDirection: 'column',
    gap: 25,
    marginBottom: 8,
    padding: 20,
    borderRadius: 10,
  },
  messageContainer: {
    backgroundColor: Colors.lightestBlue,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderWidth: 2,
    borderRadius: 10,
    borderColor: Colors.awac.navy,
    padding: 10
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  searchIcon: {
    width: 50,
    backgroundColor : Colors.lightestBlue,
    borderWidth: 2,
    borderColor: 'grey',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    gap: 15
  },
  searchBar: {
    height: 50,     
    fontSize: 16,  
  }
});