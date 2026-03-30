import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // -- AUTH LISTENER -- //
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // -- ROUTE PROTECTION  -- //
  useEffect(() => {
    if (loading) return;

    // Only redirect if we are on main app or auth stack
    const authPages = ['login', 'createAccount'];
    const appPages = ['(tabs)', 'agenda'];

    const currentPage = segments[0] || '';

    // If not logged in, protect app pages
    if (!session && appPages.includes(currentPage)) {
      router.replace('/login');
    }

    // If logged in, protect auth pages
    if (session && authPages.includes(currentPage)) {
      router.replace('/(tabs)/agenda');
    }
  }, [session, loading, segments, router]);

  // -- DEEP LINKING -- //
  useEffect(() => {
    const handleDeepLink = (url: string | null) => {
      if (!url) return;

      if (url.includes('resetPassword') || url.includes('type=recovery')) {
        router.push({
          pathname: '/resetPassword',
          params: { url: encodeURIComponent(url) },
        });
      }
    };

    Linking.getInitialURL().then(handleDeepLink);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, [router]);

  if (loading) return null;

  // -- SCREEN STACK -- //

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack
        screenOptions={{
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
        }}
      >
        {/* Auth Screens */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="createAccount" options={{ headerShown: false }} />

        {/* Reset Password */}
        <Stack.Screen
          name="resetPassword"
          options={{
            title: 'Reset Password',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />

        {/* App Root */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Inner onversation Screen */}
        <Stack.Screen
          name="conversation"
          options={{
            title: 'Conversation',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />

        {/* Inner Profile Settings Screen */}
        <Stack.Screen
          name="profileSettings"
          options={{
            title: 'Profile Settings',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />

        {/* Search Users Modal */}
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
