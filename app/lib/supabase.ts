import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Initialize and export shared Supabase client using Expo environment variables

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const { supabaseUrl, supabaseAnonKey } = Constants.expoConfig?.extra ?? {};

//auth: is for forgot password functionality
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  //Handles supabase authentication behavior
  auth: {
    storage: AsyncStorage, //where user session is stored, AsyncStorage is specifically for IOS/Android
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
