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

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_notifications')
        .select('id, is_read, notifications(text)')
        .order('created_at', { ascending: false }) // Order by most recent
        .returns<NotificationJoinedRow[]>();

      if (error) throw error;

      const formattedNotifications: Notification[] = data.map((row) => ({
        id: row.id,
        text: row.notifications?.text || 'No content available',
        read: row.is_read,
      }));

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not fetch notifications.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.umaine.darkBlue} />
      </View>
    );
  }

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
  return (
    //loads the notifications from supabase
    <View style={styles.container}>
      {/* Heather wanted manage notifications to just go to native settings */}
      <Pressable onPress={openSettings}>
        <View style={styles.button}>
          <Text style={styles.buttonText}>Manage Notifications</Text>
        </View>
      </Pressable>

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
