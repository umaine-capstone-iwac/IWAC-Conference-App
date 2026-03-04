// Initialize and export shared Supabase client using Expo environment variables

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const { supabaseUrl, supabaseAnonKey } = Constants.expoConfig?.extra ?? {};

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
