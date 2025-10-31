// supabase.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import 'react-native-url-polyfill/auto';

// ✅ Get environment variables safely
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.supabaseUrl ||
  'https://fuavfvdzfzdvibffsunv.supabase.co'; // fallback

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  Constants.expoConfig?.extra?.supabaseKey ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1YXZmdmR6ZnpkdmliZmZzdW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NzkyMDMsImV4cCI6MjA3NzI1NTIwM30.iuJmh5Y860UZseZDaT2GHqMKWob3UAapvQHRcK0t9SQ'; // fallback

// ⚠️ Warn developer if env vars are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase environment variables are not set!\n' +
      'Please create a .env file in the project root with:\n' +
      'EXPO_PUBLIC_SUPABASE_URL=your-supabase-url\n' +
      'EXPO_PUBLIC_SUPABASE_KEY=your-supabase-key\n' +
      '\nThen restart your development server.'
  );
}

// ✅ Initialize Supabase client lazily
let supabase = null;

// Detect if we are in a browser (Expo Web) or React Native
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
const isReactNative = globalThis.navigator?.product === 'ReactNative';

// Defer initialization slightly (important for Expo Web hydration)
if (isWeb || isReactNative) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: isWeb ? undefined : AsyncStorage, // use localStorage for web automatically
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
} else {
  // Only log once during server build
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ Supabase client not initialized: non-runtime environment (SSR or build).');
  }
}

export { supabase };


// -------------------------------
// Type definitions (for reference)
// -------------------------------

export interface User {
  user_id: string;
  email: string;
  password_hash: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  user_type: 'admin' | 'security_officer' | 'neighborhood_member';
  status: 'active' | 'suspended' | 'deleted' | 'pending_approval';
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface SecurityOfficer {
  officer_id: string;
  employee_id?: string;
  approved_by_admin_id?: string;
  suspension_start_date?: string;
  suspension_end_date?: string;
  suspension_reason?: string;
  is_permanently_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmergencyAlert {
  alert_id: string;
  raised_by_member_id: string;
  alert_type: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  status: 'active' | 'resolved' | 'cancelled';
  created_at: string;
  resolved_at?: string;
  resolved_by_officer_id?: string;
}

export interface PatrolScan {
  scan_id: string;
  officer_id: string;
  qr_code_id: string;
  scan_timestamp: string;
  comments?: string;
  latitude?: number;
  longitude?: number;
  synced_at?: string;
  created_at_device?: string;
  created_at: string;
}

export interface QRCode {
  qr_code_id: string;
  qr_code_value: string;
  location_description?: string;
  gate_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityPost {
  post_id: string;
  member_id: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface NeighborhoodMember {
  member_id: string;
  house_number?: string;
  street_address?: string;
  subscription_status: 'active' | 'suspended' | 'cancelled';
  subscription_start_date?: string;
  last_payment_date?: string;
  approved_by_admin_id?: string;
  created_at: string;
  updated_at: string;
}

