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
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

// -- PROPS -- //

interface LogoutModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LogoutModal({ visible, onClose }: LogoutModalProps) {
  // -- STATE -- //

  // Message state (error or success)
  const [message, setMessage] = useState('');

  // Loading state
  const [loading, setLoading] = useState(false);

  // Email sent state
  const [loggedOut, setLoggedOut] = useState(false);

  // -- HELPERS -- //

  // Call passed onClose function
  const handleClose = () => {
    onClose();
  };

  // -- PASSWORD RESET -- //

  // Send a password reset email to the provided address
  const handleLogout = async () => {
    setMessage('');

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout failed:', error.message);
      setMessage('Logout failed. Please try again later.');
    } else {
      console.log('User signed out successfully');
      router.replace('/login');
    }

    setLoading(false);
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
          {/* Logout title */}
          <ThemedText type="subtitle" style={styles.modalTitle}>
            Logout
          </ThemedText>

          {/* Logout message */}
          <Text style={styles.modalBody}>
            Are you sure you would like to logout?
          </Text>

          {/* Inline error or success message, if any */}
          {message ? <Text style={styles.message}> {message} </Text> : null}

          {/* 'Yes' and 'No buttons or activity indicator */}
          {loading ? (
            // Show spinner while processing request
            <ActivityIndicator
              style={{ marginTop: 12 }}
              color={Colors.awac.orange}
            />
          ) : (
            // Show buttons if not loading
            <View style={styles.buttonsContainer}>
              <TouchableOpacity onPress={handleLogout}>
                <View style={styles.submitButton}>
                  <Text style={styles.submitButtonText}>Confirm</Text>
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
    color: 'red',
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
  dismissText: {
    alignSelf: 'center',
    marginTop: 8,
    color: 'mediumblue',
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 6,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
});
