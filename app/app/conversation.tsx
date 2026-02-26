import {
  FlatList,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Input } from '@/components/input';
import { ProfilePicture } from '@/components/profile-picture';
import { Colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function ConversationScreen() {
  const navigation = useNavigation();

  // -- STATE -- //

  // Auth state
  const [userID, setUserID] = useState<string>();

  // Other user state
  const [otherUser, setOtherUser] = useState<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  }>();

  // Messages state
  const [messages, setMessages] = useState<
    {
      id: number;
      content: string;
      timestamp: string;
      fromUser: boolean;
      isRead: boolean | null;
    }[]
  >([]);

  // Input state
  const [newMessage, setNewMessage] = useState<string>('');

  // -- REFS -- //

  const flatListRef = useRef<FlatList>(null);

  // -- PARAMS -- //

  const { otherUserID } = useLocalSearchParams();

  // -- DATA LOADING FUNCTIONS -- //

  // Scroll to the bottom of the chat
  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated });
    }, 50);
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !userID || !otherUser) return;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        user_id: userID,
        recipient_id: otherUser.id,
        content: newMessage,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    // If successful, update UI
    setMessages((prev) => [
      ...prev,
      {
        id: data.id,
        content: data.content,
        timestamp: data.timestamp,
        fromUser: true,
        isRead: data.is_read,
      },
    ]);

    setNewMessage('');
    scrollToBottom(true);
  };

  // Load the other user's profile info
  const loadOtherUser = useCallback(async () => {
    if (!otherUserID) return;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('id', otherUserID)
      .single();

    if (userError || !userData) {
      console.error('Error loading other user:', userError);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', otherUserID) // assuming profile.id = user.id
      .single();

    if (profileError) {
      console.error('Error loading user profile:', profileError);
    }

    setOtherUser({
      id: userData.id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      avatar_url: profileData?.avatar_url ?? null,
    });
  }, [otherUserID]);

  // Load all messages between the two users
  const loadMessages = useCallback(async () => {
    if (!userID || !otherUser) return;

    const { data, error } = await supabase
      .from('messages')
      .select('id, user_id, recipient_id, content, timestamp, is_read')
      .or(
        `and(user_id.eq.${userID},recipient_id.eq.${otherUser.id}),` +
          `and(user_id.eq.${otherUser.id},recipient_id.eq.${userID})`,
      )
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    const processedMessages = data.map((msg) => ({
      id: msg.id,
      content: msg.content,
      timestamp: msg.timestamp,
      fromUser: msg.user_id === userID,
      isRead: msg.is_read,
    }));

    setMessages(processedMessages);
    scrollToBottom(false);
  }, [userID, otherUser]);

  // -- AUTH INITIALIZATION -- //

  // Fetch the logged-in user's ID on mount
  useEffect(() => {
    const loadUser = async () => {
      setUserID((await supabase.auth.getSession()).data.session?.user.id);
    };
    loadUser();
  }, []);

  // -- SCREEN EFFECTS -- //

  // Load other user when param changes
  useEffect(() => {
    loadOtherUser();
  }, [loadOtherUser]);

  // Load messages when both users are ready
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Set the screen title to the other user's name
  useEffect(() => {
    if (!otherUser) return;

    const first = otherUser.first_name ?? '';
    const last = otherUser.last_name ?? '';
    const title = `${first} ${last}`.trim();

    navigation.setOptions({ title });
  }, [otherUser, navigation]);

  // -- REALTIME SUBSCRIPTION -- //

  // Subscribe to new messages in this conversation
  useEffect(() => {
    if (!userID || !otherUser) return;

    const channel = supabase
      .channel(`conversation-${userID}-${otherUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new;

          const isThisConversation =
            (msg.user_id === userID && msg.recipient_id === otherUser.id) ||
            (msg.user_id === otherUser.id && msg.recipient_id === userID);

          if (!isThisConversation) return;

          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;

            return [
              ...prev,
              {
                id: msg.id,
                content: msg.content,
                timestamp: msg.timestamp,
                fromUser: msg.user_id === userID,
                isRead: msg.is_read,
              },
            ];
          });

          scrollToBottom(true);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userID, otherUser]);

  // -- UI -- //

  const otherUserProfilePic = otherUser ? (
    <ProfilePicture
      size={35}
      avatarUrl={otherUser.avatar_url}
      userId={otherUser.id}
    />
  ) : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <FlatList
        ref={flatListRef}
        data={messages.slice().reverse()}
        inverted
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageRow,
              item.fromUser ? styles.rowRight : styles.rowLeft,
            ]}
          >
            {!item.fromUser && otherUserProfilePic}

            <View
              style={{
                flexDirection: 'column',
                alignItems: item.fromUser ? 'flex-end' : 'flex-start',
              }}
            >
              <View
                style={[
                  styles.messageBubble,
                  item.fromUser ? styles.bubbleUser : styles.bubbleOther,
                ]}
              >
                <Text style={{ fontSize: 18 }}>{item.content}</Text>
              </View>

              <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.chatContainer}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={10}
      />

      <SafeAreaView edges={['bottom']} style={styles.inputContainer}>
        <View style={{ flex: 1 }}>
          <Input
            text="Type a message..."
            multiline
            numberOfLines={4}
            style={styles.messageInput}
            value={newMessage}
            onChangeText={setNewMessage}
            autoCapitalize="sentences"
          />
        </View>

        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <ThemedText style={{ color: 'white' }}>Send</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.awac.beige,
  },
  chatContainer: {
    padding: 20,
    gap: 20,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '85%',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.awac.navy,
    backgroundColor: Colors.lightestBlue,
    maxWidth: '100%',
  },
  bubbleOther: {
    marginLeft: 10,
    backgroundColor: Colors.lightBlue,
  },
  bubbleUser: {
    backgroundColor: Colors.lightestBlue,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    borderTopWidth: 2,
    borderColor: Colors.awac.navy,
    backgroundColor: Colors.awac.beige,
    bottom: 0,
    alignItems: 'flex-end',
    width: '100%',
  },
  messageInput: {
    fontSize: 18,
  },
  sendButton: {
    backgroundColor: Colors.awac.orange,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    height: 50,
  },
  timestamp: {
    fontSize: 12,
    color: 'grey',
    marginTop: 4,
    paddingHorizontal: 4,
  },
});
