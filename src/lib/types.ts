export type Role = "client" | "therapist";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "fully_paid"
  | "rejected"
  | "cancelled";

export interface User {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string;
  role: Role;
  wallet_address: string | null;
  created_at: string;
}

export interface TherapistProfile {
  id: string;
  user_id: string;
  wallet_address: string | null;
  display_name: string;
  bio: string | null;
  price_ton: number;
  duration_minutes: number;
  max_multiplier: number;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  photos: string[];
  rating: number | null;
  is_active: boolean;
  created_at: string;
  age: number | null;
}

export interface Availability {
  id: string;
  therapist_id: string;
  day_of_week: number; // 0-6
  start_time: string; // HH:MM
  end_time: string; // HH:MM
}

export interface Booking {
  id: string;
  client_id: string;
  therapist_id: string;
  booking_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  duration_minutes: number;
  amount_ton: number;
  status: BookingStatus;
  tx_hash: string | null;
  rating: number | null;
  review: string | null;
  created_at: string;
  updated_at: string;
  // joined
  therapist_profiles?: TherapistProfile;
  users?: User;
}

export interface CreateBookingInput {
  therapist_id: string;
  booking_date: string;
  start_time: string;
  duration_minutes: number;
  amount_ton: number;
}
