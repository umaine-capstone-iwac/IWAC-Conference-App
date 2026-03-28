import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';

// -- PROPS -- //

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function AlertModal({
  visible,
  title,
  message,
  onClose,
}: AlertModalProps) {
  // -- HELPERS -- //

  // Escape newlines
  const formattedText = message.replace(/\\n/g, '\n');

  // -- UI -- //

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <ThemedText type="subtitle" style={styles.modalTitle}>
            {title}
          </ThemedText>

          <Text style={styles.modalBody}>{formattedText}</Text>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// -- STYLES -- //

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.awac.beige,
    borderRadius: 14,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  dismissText: {
    alignSelf: 'center',
    color: 'mediumblue',
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 6,
  },
});
