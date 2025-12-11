export type UserRole = 'user' | 'admin';
export type CourtType = 'indoor' | 'outdoor';
export type CourtStatus = 'available' | 'maintenance' | 'unavailable';
export type EquipmentType = 'racket' | 'shoes';
export type RuleType = 'peak_hour' | 'weekend' | 'holiday' | 'premium_court';
export type BookingStatus = 'confirmed' | 'cancelled' | 'waitlist';

export interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
}

export interface Court {
  id: string;
  name: string;
  type: CourtType;
  base_price: number;
  status: CourtStatus;
  description: string | null;
  created_at: string;
}

export interface Coach {
  id: string;
  name: string;
  hourly_rate: number;
  bio: string | null;
  specialties: string[] | null;
  status: string;
  created_at: string;
}

export interface Equipment {
  id: string;
  type: EquipmentType;
  total_stock: number;
  available_count: number;
  rental_price: number;
  created_at: string;
}

export interface PricingRule {
  id: string;
  name: string;
  rule_type: RuleType;
  start_time: string | null;
  end_time: string | null;
  days_of_week: number[] | null;
  multiplier: number;
  surcharge: number;
  is_active: boolean;
  created_at: string;
}

export interface PricingModifier {
  rule_name: string;
  rule_type: RuleType;
  amount: number;
  type: 'multiplier' | 'surcharge';
}

export interface Booking {
  id: string;
  user_id: string;
  court_id: string;
  coach_id: string | null;
  start_time: string;
  end_time: string;
  racket_count: number;
  shoes_count: number;
  base_price: number;
  pricing_modifiers: PricingModifier[];
  equipment_fee: number;
  coach_fee: number;
  total_price: number;
  status: BookingStatus;
  created_at: string;
}

export interface BookingWithDetails extends Booking {
  court?: Court;
  coach?: Coach;
  user?: Profile;
}

export interface AvailabilityCheck {
  available: boolean;
  court_available: boolean;
  coach_available: boolean;
  rackets_available: number;
  shoes_available: number;
}

export interface BookingFormData {
  court_id: string;
  coach_id: string | null;
  start_time: string;
  end_time: string;
  racket_count: number;
  shoes_count: number;
}

export interface PriceCalculation {
  base_price: number;
  pricing_modifiers: PricingModifier[];
  equipment_fee: number;
  coach_fee: number;
  total_price: number;
}

export type WaitlistStatus = 'waiting' | 'notified' | 'expired';

export interface Waitlist {
  id: string;
  user_id: string;
  court_id: string;
  start_time: string;
  end_time: string;
  coach_id: string | null;
  racket_count: number;
  shoes_count: number;
  status: WaitlistStatus;
  position: number;
  created_at: string;
  notified_at: string | null;
}

export interface WaitlistWithDetails extends Waitlist {
  user?: Profile;
  court?: Court;
  coach?: Coach;
}

export interface WaitlistPosition {
  in_waitlist: boolean;
  position: number | null;
  total_waiting: number;
}

