import { Tabs, router } from 'expo-router';
import { Dimensions, StyleSheet, Platform } from 'react-native';
import { HapticTab } from '@/components/hapticTab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 768;

// Main tab layout for the authenticated portion of app
export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="agenda"
      screenOptions={{
        tabBarActiveTintColor: Colors.awac.beige,
        tabBarInactiveTintColor: Colors.umaine.darkBlue,
        tabBarStyle: [
          styles.tabBar,
          // Protect android bottom bar
          Platform.OS === 'android' && {
            height: (isTablet ? 90 : 75) + insets.bottom,
            paddingBottom: insets.bottom,
          },
        ],
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
      }}
    >
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'My Agenda',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={30} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={30}
              name="magnifyingglass.circle.fill"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={30} name="message.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={30} name="person.fill" color={color} />
          ),
        }}
        // Force navigation to plain /profile (no params) when tab pressed
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.replace({
              pathname: '/(tabs)/profile',
              params: {},
            });
          },
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={30} name="bell.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.umaine.lightBlue,
  },
  headerTitle: {
    fontSize: 22,
  },
  tabBar: {
    backgroundColor: Colors.umaine.lightBlue,
    height: isTablet ? 90 : 75,
    paddingTop: 15,
  },
});
