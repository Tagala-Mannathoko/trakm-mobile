import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types based on your schema
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
