import { ScrollView, StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Input } from '@/components/input';
import { ProfilePicture } from '@/components/profile-picture';
import { Colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useMemo, useState } from "react";
import { supabase } from '@/lib/supabase';

export default function ConversationScreen() {

  const [userID, setUserID] = useState<string>();

  const [otherUser, setOtherUser] = useState<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    }>();

  const [messages, setMessages] = useState<{
    id: number;
    content: string;
    timestamp: string;
    fromUser: Boolean;
    isRead: Boolean | null;
  }[]>([]);

  // Fetch the logged in user's ID
  useEffect(() => {
    const loadUser = async () => {
      setUserID((await supabase.auth.getSession()).data.session?.user.id);
      console.log(userID);
    };
    loadUser();
  }, []);

  // Fetch the other user's information
  useEffect(() => {
    const loadOtherUser = async () => {
      await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('id', '43a24545-ee60-4c0a-a3f6-28f9a05c7965')
        .single()
        .then(({data,error}) => {
          if (!error && data) {
            setOtherUser(data);
            console.log(otherUser);
          } 
          else {
            console.error("Error loading other user:", error);
          }
        });
    };
    loadOtherUser();
  }, []);

  // Fetch all messages between the two users
  useEffect(() => {
    if (!userID || !otherUser) return;
    
    const loadMessages = async () => {
      await supabase
        .from('messages')
        .select('id, user_id, recipient_id, content, timestamp, is_read')
        .or(
          `and(user_id.eq.${userID},recipient_id.eq.${otherUser.id}),` +
          `and(user_id.eq.${otherUser.id},recipient_id.eq.${userID})`
        )
        .order('timestamp', { ascending: true })
        .then(({data,error}) => {
          if (!error && data) {
          const processedMessages = data.map(msg => ({
            id: msg.id,
            content: msg.content,
            timestamp: msg.timestamp,
            fromUser: msg.user_id === userID,
            isRead: msg.is_read,
        }));

        setMessages(processedMessages);
        console.log(processedMessages);
          } 
          else {
            console.error("Error loading messages:", error);
          }
        });
    };
    loadMessages();
  }, [userID, otherUser]); 

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.chatContainer}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageRow,
              msg.fromUser ? styles.rowRight : styles.rowLeft,
            ]}
          >
            {!msg.fromUser && (
              <ProfilePicture
                size={35}
                source={require('@/assets/images/profile-picture.png')}
              />
            )}
            <View
              style={[
                styles.messageBubble,
                msg.fromUser ? styles.bubbleUser : styles.bubbleOther,
              ]}
            >
              <ThemedText>{msg.content}</ThemedText>
            </View>
          </View>
        ))}
      </ScrollView>

      <SafeAreaView edges = {['bottom']} style={styles.inputContainer}>
        <Input text = "Type a message..."/>
        <TouchableOpacity style={styles.sendButton}>
          <ThemedText style={{ color: 'white' }}>Send</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
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
    paddingBottom: 80,
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
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  sendButton: {
    backgroundColor: Colors.awac.orange,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
  },
});