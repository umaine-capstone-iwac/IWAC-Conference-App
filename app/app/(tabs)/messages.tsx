import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { ProfilePicture } from '@/components/profile-picture';
import { ThemedText } from '@/components/themed-text';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Input } from '@/components/input';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { filterMessages } from '@/utils/filterMessages';

export default function MessagesListScreen() {
  // -- STATE -- //

  const [currentUserID, setUserID] = useState<string>();

  type ConversationPreview = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    lastMessage: string | null;
    timestamp: string | null;
  };
  const [conversations, setConversationUsers] = useState<ConversationPreview[]>(
    [],
  );

  const [search, setSearch] = useState('');

  // -- DERIVED DATA -- //

  // Filter conversations based on search input
  const filteredConversations = filterMessages(conversations, search);

  // -- DATA LOADING -- //

  // Load all conversations involving the current user
  const loadConversations = useCallback(async () => {
    if (!currentUserID) return;
    // Fetch all messages involving the current user
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, user_id, recipient_id, content, timestamp')
      .or(`user_id.eq.${currentUserID},recipient_id.eq.${currentUserID}`)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    // Extract unique IDs of users involved in conversations
    const otherUserIds = Array.from(
      new Set(
        messages.map((msg) =>
          msg.user_id === currentUserID ? msg.recipient_id : msg.user_id,
        ),
      ),
    );

    // Fetch user info for each of those IDs
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .in('id', otherUserIds);

    if (usersError || !usersData) {
      console.error('Error fetching users:', usersError);
      return;
    }

    // Attach last message and timestamp to each user
    const usersWithLastMessage = usersData.map((user) => {
      const lastMsg = messages.find(
        (msg) => msg.user_id === user.id || msg.recipient_id === user.id,
      );
      return {
        ...user,
        lastMessage: lastMsg?.content ?? null,
        timestamp: lastMsg?.timestamp ?? null,
      };
    });

    setConversationUsers(usersWithLastMessage);
  }, [currentUserID]);

  // -- AUTH INITIALIZATION -- //

  // Fetch the currently logged-in user's ID on mount
  useEffect(() => {
    const loadUser = async () => {
      setUserID((await supabase.auth.getSession()).data.session?.user.id);
    };
    loadUser();
  }, []);

  // -- SCREEN LIFECYCLE -- //

  // Refresh conversations whenever this screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations]),
  );

  // -- REALTIME SUBSCRIPTION -- //

  // Subscribe to message changes relevant to the current user
  useEffect(() => {
    if (!currentUserID) return;

    const sentChannel = supabase
      .channel('messages-sent')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `user_id=eq.${currentUserID}`,
        },
        loadConversations,
      )
      .subscribe();

    const receivedChannel = supabase
      .channel('messages-received')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${currentUserID}`,
        },
        loadConversations,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sentChannel);
      supabase.removeChannel(receivedChannel);
    };
  }, [currentUserID, loadConversations]);

  // -- UI -- //

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
            <Pressable onPress={() => router.push('/modals/search-users')}>
              <Text style={{ fontWeight: 'bold', fontSize: 24 }}> + </Text>
            </Pressable>
          </View>
        </View>

        {filteredConversations.map((user) => (
          <Pressable
            key={user.id}
            onPress={() => router.push(`/conversation?otherUserID=${user.id}`)}
          >
            <View style={styles.messageContainer}>
              <ProfilePicture
                size={40}
                source={require('@/assets/images/profile-picture.png')}
                userId={user.id}
              />
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
    backgroundColor: Colors.awac.beige,
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
    padding: 10,
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
    backgroundColor: Colors.lightestBlue,
    borderWidth: 2,
    borderColor: 'grey',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  searchBar: {
    height: 50,
    fontSize: 16,
    flex: 1,
  },
});
