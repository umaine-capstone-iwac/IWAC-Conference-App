import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false}} />
        <Stack.Screen name="modals/conversation" 
          options={{  
            title: 'Shelly Smith', 
            headerStyle: styles.header, 
            headerTitleStyle: styles.headerTitle,
            headerBackButtonDisplayMode: 'minimal',
            }} />
        <Stack.Screen
          name="modals/search-users"
          options={{
            presentation: "modal",
            title: "Start a Conversation",
            headerStyle: styles.header, 
            headerTitleStyle: styles.headerTitle,
          }}
        />
        <Stack.Screen 
          name = "modals/profilesettings"
          options={{
            title: "Back to profile",
            headerStyle: styles.header,
            headerTitleStyle: styles.headerTitle,
          }}
        />
        <Stack.Screen 
          name = "modals/notificationsettings"
          options={{
            title: "Back to notifications",
            headerStyle: styles.header,
            headerTitleStyle: styles.headerTitle,
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal'}} />
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
  }
});
