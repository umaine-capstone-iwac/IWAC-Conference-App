import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="createAccount" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="conversation"
          options={{
            title: 'Conversation',
            headerStyle: styles.header,
            headerTitleStyle: styles.headerTitle,
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <Stack.Screen
          name="modals/search-users"
          options={{
            presentation: 'modal',
            title: 'Start a Conversation',
            headerStyle: styles.header,
            headerTitleStyle: styles.headerTitle,
          }}
        />
        <Stack.Screen
          name="profilesettings"
          options={{
            title: 'Profile Settings',
            headerStyle: styles.header,
            headerTitleStyle: styles.headerTitle,
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <Stack.Screen
          name="modals/notificationsettings"
          options={{
            presentation: 'modal',
            title: 'Manage Notifications',
            headerStyle: styles.header,
            headerTitleStyle: styles.headerTitle,
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: 'modal', title: 'Modal' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.umaine.lightBlue,
  },
  headerTitle: {
    fontSize: 20,
  },
});
