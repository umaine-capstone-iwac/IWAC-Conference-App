import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';

// Root layout that defines global navigation stack and theme
export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const handleDeepLink = (url: string | null) => {
      if (!url) return;

      console.log('Root layout URL:', url);

      if (url.includes('resetPassword') || url.includes('type=recovery')) {
        router.push({
          pathname: '/resetPassword',
          params: { url: encodeURIComponent(url) },
        });
      }
    };

    // Case where app launched via deep link
    Linking.getInitialURL().then(handleDeepLink);

    // Case where app already open when link is tapped
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, [router]);

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack initialRouteName="index">
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
          name="modals/searchUsers"
          options={{
            presentation: 'modal',
            title: 'Start a Conversation',
            headerStyle: styles.header,
            headerTitleStyle: styles.headerTitle,
          }}
        />
        <Stack.Screen
          name="profileSettings"
          options={{
            title: 'Profile Settings',
            headerStyle: styles.header,
            headerTitleStyle: styles.headerTitle,
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <Stack.Screen
          name="modals/notificationSettings"
          options={{
            presentation: 'modal',
            title: 'Manage Notifications',
            headerStyle: styles.header,
            headerTitleStyle: styles.headerTitle,
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <Stack.Screen
          name="resetPassword"
          options={{
            title: 'Reset Password',
            headerStyle: styles.header,
            headerTitleStyle: styles.headerTitle,
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <Stack.Screen
          name="forgotPassword"
          options={{
            title: 'Forgot Password',
            headerStyle: styles.header,
            headerTitleStyle: styles.headerTitle,
            headerBackButtonDisplayMode: 'minimal',
          }}
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
