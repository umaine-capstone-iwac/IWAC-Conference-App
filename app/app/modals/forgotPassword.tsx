import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Input } from '@/components/input';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({
  visible,
  onClose,
}: ForgotPasswordModalProps) {
  // -- STATE -- //

  // Email input state
  const [forgotEmail, setForgotEmail] = useState('');

  // Message state (error or success)
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Loading state
  const [loading, setLoading] = useState(false);

  // Email sent state
  const [emailSent, setEmailSent] = useState(false);

  // -- HELPERS -- //

  // Reset all modal state on close
  const handleClose = () => {
    setForgotEmail('');
    setMessage('');
    setIsError(false);
    setLoading(false);
    setEmailSent(false);
    onClose();
  };

  // Check if an email is registered for the conference
  const checkRegistrant = async (email: string) => {
    const { count, error } = await supabase
      .from('users_registered')
      .select('email', { count: 'exact', head: true })
      .eq('email', email);

    if (error)
      return { valid: false, message: 'Error checking registrants list' };
    if (!count || count === 0)
      return {
        valid: false,
        message: 'Email not registered for the IWAC conference',
      };

    return { valid: true, message: '' };
  };

  // -- PASSWORD RESET -- //

  // Send a password reset email to the provided address
  const handlePasswordReset = async () => {
    setMessage('');

    // Verify email is entered
    if (!forgotEmail) {
      setIsError(true);
      setMessage('Please enter your email address.');
      return;
    }

    setLoading(true);

    // Check that the email is registered for the conference
    const result = await checkRegistrant(forgotEmail);

    // Return if not registered
    if (!result.valid) {
      setIsError(true);
      setMessage(result.message);
      setLoading(false);
      return;
    }

    // If registered, send reset password email
    await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: 'iwacapp://resetpassword',
    });

    // Show success message
    setIsError(false);
    setMessage(
      `A password reset link has been sent to ${forgotEmail}. Please check your inbox.`,
    );
    setLoading(false);
    setEmailSent(true);
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
          <ThemedText type="subtitle" style={styles.modalTitle}>
            Reset Password
          </ThemedText>

          <Text style={styles.modalBody}>
            Enter the email address your IWAC account is registered with.
          </Text>

          <Input
            text="email@address.com"
            onChangeText={setForgotEmail}
            autoCapitalize="none"
            style={styles.input}
          />

          {/* Inline error or success message */}
          {message ? (
            <Text
              style={[
                styles.message,
                isError ? styles.messageError : styles.messageSuccess,
              ]}
            >
              {message}
            </Text>
          ) : null}

          {loading ? (
            // Show spinner while sending
            <ActivityIndicator
              style={{ marginTop: 12 }}
              color={Colors.awac.orange}
            />
          ) : !emailSent ? (
            // Show button if email not yet sent
            <TouchableOpacity onPress={handlePasswordReset}>
              <View style={styles.submitButton}>
                <Text style={styles.submitButtonText}>Send Reset Link</Text>
              </View>
            </TouchableOpacity>
            // Else, show nothing
          ) : null}

          <TouchableOpacity onPress={handleClose}>
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
  input: {
    backgroundColor: Colors.lightestBlue,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  messageError: {
    color: 'red',
  },
  messageSuccess: {
    color: 'green',
  },
  submitButton: {
    backgroundColor: Colors.awac.orange,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  submitButtonText: {
    color: 'white',
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
});
