import { ScrollView, StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Input } from '@/components/input';
import { ProfilePicture } from '@/components/profile-picture';
import { Colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConversationScreen() {
  // Dummy messages to be replaced later
  const messages = [
    { id: 1, fromUser: true, text: "Hi Shelly! I loved your presentation earlier today!" },
    { id: 2, fromUser: false, text: "Thank you! I appreciate it." },
    { id: 3, fromUser: true, text: "Would you want to collaborate on my latest project about AI in education?" },
    { id: 4, fromUser: false, text: "I’m definitely interested, but would love to hear more about it first." },
    { id: 5, fromUser: true, text: "Perfect, I’ll send you some materials after the conference." },
  ];

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
              <ThemedText>{msg.text}</ThemedText>
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