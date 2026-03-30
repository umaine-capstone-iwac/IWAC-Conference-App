import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Define the structure of a notification
interface Notification {
  id: string;
  text: string;
  read: boolean;
}
//The structure of the joined table (user_notifications basically)
interface NotificationJoinedRow {
  id: string;
  is_read: boolean;
  notifications: {
    text: string;
  } | null;
}

export default function NotificationsScreen() {
  // -- STATE -- //
  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // -- DATA FETCHING -- //
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_notifications')
        .select('id, is_read, notifications(text)')
        .order('created_at', { ascending: false }) // Order by most recent
        .returns<NotificationJoinedRow[]>();

      if (error) throw error;

      // Transform the joined data into the Notification structure we want to use in our component
      const formattedNotifications: Notification[] = data.map((row) => ({
        id: row.id,
        text: row.notifications?.text || 'No content available',
        read: row.is_read,
      }));

      // Set the notifications state with the formatted data
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not fetch notifications.');
    } finally {
      setLoading(false);
    }
  };

  // -- RENDERING -- //
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.umaine.darkBlue} />
      </View>
    );
  }

  // If there are no notifications, show a message and the manage notifications button
  if (notifications.length === 0) {
    return (
      <View style={styles.container}>
        <Pressable onPress={openSettings}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Manage Notifications</Text>
          </View>
        </Pressable>
        <Text style={styles.userText}>No notifications available.</Text>
      </View>
    );
  }

  // -- INTERACTIONS -- //

  // Function to mark a notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true, read_at: new Date() })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state to reflect the change
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif,
        ),
      );
    } catch (error) {
      console.error('Update failed:', error);
    }
  };
  // -- UI -- //
  return (
    //loads the notifications from supabase
    <View style={styles.container}>

      {notifications.map((notification) => (
        <Pressable
          key={notification.id}
          onPress={() => !notification.read && markAsRead(notification.id)}
        >
          <View style={styles.userRow}>
            <Text
              style={[styles.userText, !notification.read && styles.unreadText]}
            >
              {notification.text}
            </Text>
            {!notification.read && (
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: Colors.umaine.darkBlue,
                }}
              />
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.awac.beige,
  },
  userRow: {
    padding: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderRadius: 15,
    borderColor: Colors.awac.navy,
    backgroundColor: Colors.lightestBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
    width: '100%',
  },
  textContainer: {
    flex: 1,
  },
  userText: {
    fontSize: 18,
    lineHeight: 24,
  },
  unreadText: {
    fontWeight: '700',
  },
  button: {
    backgroundColor: Colors.umaine.darkBlue,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: Colors.awac.beige,
    fontSize: 14,
    fontWeight: '600',
  },
});
