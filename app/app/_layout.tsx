import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';

export default function RootLayout() {
  // -- DEEP LINKING -- //
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;

      if (url.startsWith('iwacapp://resetPassword')) {
        router.replace({
          pathname: '/resetPassword',
          params: { url: encodeURIComponent(url) },
        });
      }
    };

    Linking.getInitialURL().then(handleUrl);

    const sub = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => sub.remove();
  }, []);

  // -- UI -- //

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack
        screenOptions={{
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
        }}
      >
        {/* AUTH */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="createAccount" options={{ headerShown: false }} />

        {/* RESET PASSWORD */}
        <Stack.Screen
          name="resetPassword"
          options={{
            title: 'Reset Password',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />

        {/* APP ROOT */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* APP INNER SCREENS */}
        <Stack.Screen
          name="conversation"
          options={{
            title: 'Conversation',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />

        <Stack.Screen
          name="profileSettings"
          options={{
            title: 'Profile Settings',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />

        {/* MODAL */}
        <Stack.Screen
          name="modals/searchUsers"
          options={{
            presentation: 'modal',
            title: 'Start a Conversation',
          }}
        />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

// -- STYLES -- //

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.umaine.lightBlue,
  },
  headerTitle: {
    fontSize: 20,
  },
});
