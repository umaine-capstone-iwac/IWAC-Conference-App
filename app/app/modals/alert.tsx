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
          {/* Alert title */}
          <ThemedText type="subtitle" style={styles.modalTitle}>
            {title}
          </ThemedText>

          {/* Alert message */}
          <Text style={styles.modalBody}>{formattedText}</Text>

          {/* Dismiss button */}
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
    fontSize: 17,
    color: '#555',
    textAlign: 'center',
    marginBottom: 16,
  },
  dismissText: {
    alignSelf: 'center',
    color: 'mediumblue',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 6,
  },
});
