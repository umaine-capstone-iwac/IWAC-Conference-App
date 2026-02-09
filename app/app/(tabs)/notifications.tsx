import { View, Text, StyleSheet, Pressable, Platform, Linking, Alert, ActivityIndicator} from "react-native";
import { Colors } from "@/constants/theme";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Dummy user names to be replaced later

interface Notification {
  id: string;
  text: string;
  //time: string; 
  //read: boolean;
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
      const { data, error } = await supabase
        .from('notifications')
        .select('id, text')
        //.order('created_at', { ascending: true });
      if (error) throw error;

      const displayedNotifications = data?.map((row: any) => ({ id: row.id, text: row.text })).filter(Boolean) ?? [];
      setNotifications(displayedNotifications);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not fetch notifications.");
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
              <View style = {styles.button}>
                <Text style={styles.buttonText}>Manage Notifications</Text>
              </View>
            </Pressable>
        <Text style={styles.userText}>No notifications available.</Text>
      </View>
    );
  }



  return ( //loads the notifications from supabase
    <View style={styles.container}>
            {/* Heather wanted manage notifications to just go to native settings */}
            <Pressable onPress={openSettings}>
              <View style = {styles.button}>
                <Text style={styles.buttonText}>Manage Notifications</Text>
              </View>
            </Pressable>

        {notifications.map(notification => (
          <View key={notification.id} style={styles.userRow}>
            <Text style={styles.userText}>{notification.text}</Text>
          </View>

        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.awac.beige
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
    width: '100%'
  },
  textContainer: {
    flex: 1,       
},
  userText: {
    fontSize: 18,
    lineHeight: 24,
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
  }
});