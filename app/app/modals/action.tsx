import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { useEffect, useState } from 'react';

// -- PROPS -- //

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  caption: string;
  confirmText: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  caption,
  confirmText,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  // -- STATE -- //

  // Message state (error or success)
  const [message, setMessage] = useState('');

  // Loading state
  const [loading, setLoading] = useState(false);

  // -- INITIALIZATION -- //

  // Clear message and loading on modal open
  useEffect(() => {
    if (visible) {
      setMessage('');
      setLoading(false);
    }
  }, [visible]);

  // -- HELPERS -- //

  // Call passed onClose function on 'Cancel'
  const handleClose = () => {
    onClose();
  };

  // Run passed confirm function on 'Confirm'
  const handleConfirm = async () => {
    if (loading) return;

    setLoading(true);
    setMessage('');

    try {
      await onConfirm();
    } catch (error: unknown) {
      console.error('Confirm action failed:', error);

      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // -- UI -- //

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Modal title */}
          <ThemedText type="subtitle" style={styles.modalTitle}>
            {title}
          </ThemedText>

          {/* Modal message */}
          <Text style={styles.modalBody}>{caption}</Text>

          {/* Inline error or success message, if any */}
          {message ? <Text style={styles.message}> {message} </Text> : null}

          {/* Buttons or activity indicator */}
          {loading ? (
            // Show spinner while processing request
            <ActivityIndicator
              style={{ marginTop: 12 }}
              color={Colors.awac.orange}
            />
          ) : (
            // Show buttons if not loading
            <View style={styles.buttonsContainer}>
              <TouchableOpacity onPress={handleConfirm} disabled={loading}>
                <View style={styles.submitButton}>
                  <Text style={styles.submitButtonText}>{confirmText}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleClose}>
                <View style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
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
  submitButton: {
    backgroundColor: Colors.awac.orange,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.awac.orange,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.awac.orange,
  },
  cancelButtonText: {
    color: Colors.awac.orange,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
});
