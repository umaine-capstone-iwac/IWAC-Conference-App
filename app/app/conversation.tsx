import {
  FlatList,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themedText';
import { Input } from '@/components/input';
import { ProfilePicture } from '@/components/profilePicture';
import ActionModal from '@/app/modals/action';
import { IconSymbol } from '@/components/ui/icon-symbol';
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
      isRead: boolean;
      reported: boolean;
    }[]
  >([]);

  // Reporting state
  const [reportModalVisible, setReportModalVisible] = useState(false);

  // Selected message
  const [selectedMessage, setSelectedMessage] = useState<null | {
    id: number;
    reported: boolean;
  }>(null);

  // Block state
  const [blockStatus, setBlockStatus] = useState<{
    iBlocked: boolean;
    theyBlockedMe: boolean;
  }>({
    iBlocked: false,
    theyBlockedMe: false,
  });
  const isBlockedEitherWay = blockStatus.iBlocked || blockStatus.theyBlockedMe;

  // Input state
  const [newMessage, setNewMessage] = useState<string>('');

  // -- REFS -- //

  const flatListRef = useRef<FlatList>(null);

  // -- PARAMS -- //

  const { otherUserID } = useLocalSearchParams();

  // -- AUTH INITIALIZATION -- //

  // Fetch the logged-in user's ID on mount
  useEffect(() => {
    const loadUser = async () => {
      setUserID((await supabase.auth.getSession()).data.session?.user.id);
    };
    loadUser();
  }, []);

  // -- DATA FETCHING -- //

  // Load the other user's profile info
  const loadOtherUser = useCallback(async () => {
    if (!otherUserID) return;

    // Fetch id, first name, and last name from 'users'
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('id', otherUserID)
      .single();

    if (userError || !userData) {
      console.error('Error loading other user:', userError);
      return;
    }

    // Fetch profile picture url from 'profiles'
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', otherUserID)
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

    // Fetch message id, userID, otherUserID, content, timestamp, and read status
    // from 'messages'
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

    const messageIds = (data ?? []).map((m) => m.id);

    let reportedSet = new Set<number>();

    // Gather which messages have been reported
    if (messageIds.length > 0) {
      const { data: reports, error: reportError } = await supabase
        .from('reports')
        .select('target_id')
        .eq('reporter_user_id', userID)
        .eq('target_type', 'message')
        .in('target_id', messageIds);

      if (reportError) {
        console.error('Error loading reports:', reportError);
      } else {
        reportedSet = new Set(reports.map((r) => r.target_id));
      }
    }

    // Store all messages in processedMessages
    const processedMessages = data.map((msg) => ({
      id: msg.id,
      content: msg.content,
      timestamp: msg.timestamp,
      fromUser: msg.user_id === userID,
      isRead: msg.is_read,
      reported: reportedSet.has(msg.id),
    }));

    setMessages(processedMessages);
    // Show most recent message after loading, without scroll animation
    scrollToBottom(false);
  }, [userID, otherUser]);

  // Load block status
  const loadBlockStatus = useCallback(async () => {
    if (!userID || !otherUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('blocks')
        .select('blocker_user_id, blocked_user_id')
        .or(
          `and(blocker_user_id.eq.${userID},blocked_user_id.eq.${otherUser.id}),` +
            `and(blocker_user_id.eq.${otherUser.id},blocked_user_id.eq.${userID})`,
        );

      if (error) {
        console.error('Error loading block status:', error);
        return;
      }

      const iBlocked = data?.some(
        (b) =>
          b.blocker_user_id === userID && b.blocked_user_id === otherUser.id,
      );

      const theyBlockedMe = data?.some(
        (b) =>
          b.blocker_user_id === otherUser.id && b.blocked_user_id === userID,
      );

      setBlockStatus({
        iBlocked: !!iBlocked,
        theyBlockedMe: !!theyBlockedMe,
      });
    } catch (err) {
      console.error('Unexpected error loading block status:', err);
    }
  }, [userID, otherUser?.id]);

  // -- DATA UPLOADING -- //

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !userID || !otherUser) return;

    // Insert the new message into 'messages'
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
        reported: false,
      },
    ]);

    setNewMessage(''); // Clear input field
    scrollToBottom(true); // Animated scroll to the newly sent message
  };

  // Report or unreport a message
  const toggleReportMessage = async () => {
    if (!userID || !selectedMessage) return;

    const message = messages.find((m) => m.id === selectedMessage.id);
    if (!message) return;

    if (message.reported) {
      // Unreport
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('reporter_user_id', userID)
        .eq('target_type', 'message')
        .eq('target_id', selectedMessage.id);

      if (error) {
        throw error;
      }
    } else {
      // Report
      const { error } = await supabase.from('reports').insert({
        reporter_user_id: userID,
        target_type: 'message',
        target_id: selectedMessage.id,
      });

      if (error) {
        throw error;
      }
    }

    // Update flag icon of targetted message
    setMessages((prev) =>
      prev.map((m) =>
        m.id === selectedMessage.id ? { ...m, reported: !m.reported } : m,
      ),
    );
  };

  // Mark messages from otherUser as read
  const markConversationAsRead = useCallback(async () => {
    if (!userID || !otherUser) return;

    // Change is_read to True in 'messages'
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('recipient_id', userID)
      .eq('user_id', otherUser.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking messages as read:', error);
      return;
    }
  }, [userID, otherUser]);

  // -- SCREEN EFFECTS -- //

  // Trigger profile fetch when the conversation partner changes
  useEffect(() => {
    loadOtherUser();
  }, [loadOtherUser]);

  // After both users are resolved, load the conversation history
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Load the block status
  useEffect(() => {
    loadBlockStatus();
  }, [loadBlockStatus]);

  // Set the screen title to the other user's name
  useEffect(() => {
    if (!otherUser) return;

    const first = otherUser.first_name ?? '';
    const last = otherUser.last_name ?? '';
    const title = `${first} ${last}`.trim();

    navigation.setOptions({ title });
  }, [otherUser, navigation]);

  // Mark new messages as read on screen open
  useEffect(() => {
    if (!userID || !otherUser) return;
    markConversationAsRead();
  }, [userID, otherUser, markConversationAsRead]);

  // -- REALTIME SUBSCRIPTION -- //

  // Subscribe to new messages in this conversation
  useEffect(() => {
    if (!userID || !otherUser) return;

    // Create a realtime channel scoped to this conversation
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

          // Ensure the inserted message belongs to THIS conversation
          const isThisConversation =
            (msg.user_id === userID && msg.recipient_id === otherUser.id) ||
            (msg.user_id === otherUser.id && msg.recipient_id === userID);

          if (!isThisConversation) return;

          // Add message to local state (avoid duplicates from optimistic updates)
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
                reported: msg.reported,
              },
            ];
          });

          // If new message was sent to the current user, mark it as read in DB
          if (msg.user_id === otherUser.id && msg.recipient_id === userID) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', msg.id);
          }

          // Animated sroll to the bottom of the chat
          scrollToBottom(true);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userID, otherUser]);

  // -- UI -- //

  // Scroll to the bottom of the chat
  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated });
    }, 50);
  };

  // Construct the other user's profile piture once for efficiency
  const otherUserProfilePic = otherUser ? (
    <ProfilePicture
      size={40}
      avatarUrl={otherUser.avatar_url}
      userId={otherUser.id}
    />
  ) : null;

  // -- UI -- //
  const innerContent = (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={messages.slice().reverse()}
        inverted
        keyExtractor={(item) => item.id.toString()}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: 'column',
              alignItems: item.fromUser ? 'flex-end' : 'flex-start',
            }}
          >
            <View style={styles.messageRow}>
              {/* Profile picture (incoming only) */}
              {!item.fromUser && otherUserProfilePic}

              {/* Message bubble + flag (incoming only)) */}
              <View
                style={[
                  styles.messageBubble,
                  item.fromUser ? styles.bubbleUser : styles.bubbleOther,
                ]}
              >
                <Text style={{ fontSize: 18 }}>{item.content}</Text>
              </View>

              {/* Flag icon, if from other user) */}
              {!item.fromUser && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedMessage(item);
                    setReportModalVisible(true);
                  }}
                >
                  <IconSymbol
                    size={18}
                    name={item.reported ? 'flag.fill' : 'flag'}
                    color={
                      item.reported ? Colors.awac.orange : Colors.awac.navy
                    }
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Timestamp */}
            <Text style={styles.timestamp}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.chatContainer}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={10}
      />

      <View style={styles.inputContainer}>
        {isBlockedEitherWay ? (
          <View style={styles.blockedContainer}>
            <ThemedText style={styles.blockedText}>
              {blockStatus.iBlocked
                ? 'You blocked this user.'
                : 'You cannot message this user.'}
            </ThemedText>
          </View>
        ) : (
          <>
            <View style={{ flex: 1 }}>
              <Input
                text="Type a message..."
                multiline
                numberOfLines={4}
                value={newMessage}
                onChangeText={setNewMessage}
                autoCapitalize="sentences"
              />
            </View>
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <ThemedText style={{ color: 'white' }}>Send</ThemedText>
            </TouchableOpacity>
          </>
        )}

        {/* Report Modal */}
        <ActionModal
          visible={reportModalVisible}
          title={selectedMessage?.reported ? 'Remove Report' : 'Report Message'}
          caption={
            selectedMessage?.reported
              ? 'Do you want to remove your report?'
              : 'Are you sure you want to report this message to an admin?'
          }
          confirmText={selectedMessage?.reported ? 'Unreport' : 'Report'}
          successMessage={
            selectedMessage?.reported
              ? 'Message successfully unreported.'
              : 'Message successfully reported to an administrator. They will review the content within 24 hours and take action as necessary.'
          }
          onClose={() => {
            setReportModalVisible(false);
            setSelectedMessage(null);
          }}
          onConfirm={async () => {
            if (!selectedMessage) return;

            await toggleReportMessage();
          }}
        />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 100}
    >
      {innerContent}
    </KeyboardAvoidingView>
  );
}

// -- STYLES -- //

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
    maxWidth: '80%',
    gap: 8,
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
    paddingBottom: Platform.OS === 'android' ? 30 : 12,
    gap: 10,
    borderTopWidth: 2,
    borderColor: Colors.awac.navy,
    backgroundColor: Colors.awac.beige,
    alignItems: 'flex-end',
    width: '100%',
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
    marginLeft: 54,
    paddingHorizontal: 4,
  },
  blockedContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.awac.navy,
    borderRadius: 10,
    backgroundColor: Colors.lightestBlue,
  },

  blockedText: {
    fontSize: 20,
    color: Colors.awac.navy,
    fontWeight: '600',
    textAlign: 'center',
  },
});
