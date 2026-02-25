import {
  ScrollView,
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
import { useEffect, useState, useRef } from 'react';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function ConversationScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);

  //User State
  const [userID, setUserID] = useState<string>();
  const [otherUser, setOtherUser] = useState<{
    id: string;
    first_name: string | null;
    last_name: string | null;
  }>();

  //Message State
  const [newMessage, setNewMessage] = useState<string>('');

  //Scroll to the bottom of the chat
  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated });
    }, 50);
  };

  //Send message function
  const sendMessage = async () => {
    if (!newMessage.trim() || !userID || !otherUser) return;

    // Insert into Supabase
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

    // Update local messages list immediately
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

    setNewMessage(''); // Clear input
    scrollToBottom(true);
  };

  // Fetch the logged in user's ID
  useEffect(() => {
    const loadUser = async () => {
      setUserID((await supabase.auth.getSession()).data.session?.user.id);
    };
    loadUser();
    // console.log("User ID: ", userID);
  }, []);

  const { otherUserID } = useLocalSearchParams();

  useEffect(() => {
    if (otherUserID) {
      // console.log("Paramname: ", otherUserID)
    }
  }, [otherUserID]);

  // Fetch the other user's information
  useEffect(() => {
    if (!otherUserID) return;

    const loadOtherUser = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('id', otherUserID)
        .single();

      if (error) {
        console.error('Error loading other user:', error);
        return;
      }
      setOtherUser(data);
      // console.log("Other User: ", otherUser);
    };
    loadOtherUser();
  }, []);

  // Make the screen title the other user's name
  useEffect(() => {
    if (!otherUser) return;

    const first = otherUser.first_name ?? '';
    const last = otherUser.last_name ?? '';
    const title = `${first} ${last}`.trim();

    navigation.setOptions({
      title,
    });
  }, [otherUser]);

  const [messages, setMessages] = useState<
    {
      id: number;
      content: string;
      timestamp: string;
      fromUser: boolean;
      isRead: boolean | null;
    }[]
  >([]);

  // Fetch all messages between the two users
  useEffect(() => {
    if (!userID || !otherUser) return;

    const loadMessages = async () => {
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
    };
    loadMessages();
  }, [userID, otherUser]);

  // Fetch new messages from the other user in realtime
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
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userID, otherUser]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        contentContainerStyle={styles.chatContainer}
        ref={scrollViewRef}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageRow,
              msg.fromUser ? styles.rowRight : styles.rowLeft,
            ]}
          >
            {!msg.fromUser && otherUser && (
              <ProfilePicture
                size={35}
                source={require('@/assets/images/profile-picture.png')}
                userId={otherUser.id}
              />
            )}
            <View
              style={{
                flexDirection: 'column',
                alignItems: msg.fromUser ? 'flex-end' : 'flex-start',
              }}
            >
              <View
                style={[
                  styles.messageBubble,
                  msg.fromUser ? styles.bubbleUser : styles.bubbleOther,
                ]}
              >
                <Text style={{ fontSize: 18 }}>{msg.content}</Text>
              </View>
              <Text style={styles.timestamp}>
                {new Date(msg.timestamp).toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

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
    // position: 'absolute',
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
