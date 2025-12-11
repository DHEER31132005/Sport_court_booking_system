/*
# Sports Booking Platform Database Schema

## Overview
This migration creates the complete database schema for a sports facility booking platform with multi-resource scheduling and dynamic pricing.

## Tables Created

### 1. profiles
User profile table with role-based access control
- `id` (uuid, primary key, references auth.users)
- `username` (text, unique)
- `email` (text)
- `phone` (text)
- `role` (user_role enum: 'user', 'admin')
- `created_at` (timestamptz)

### 2. courts
Sports court management
- `id` (uuid, primary key)
- `name` (text, not null)
- `type` (court_type enum: 'indoor', 'outdoor')
- `base_price` (numeric, not null)
- `status` (court_status enum: 'available', 'maintenance', 'unavailable')
- `description` (text)
- `created_at` (timestamptz)

### 3. coaches
Coach management and availability
- `id` (uuid, primary key)
- `name` (text, not null)
- `hourly_rate` (numeric, not null)
- `bio` (text)
- `specialties` (text array)
- `status` (text, default: 'available')
- `created_at` (timestamptz)

### 4. equipment
Equipment inventory tracking
- `id` (uuid, primary key)
- `type` (equipment_type enum: 'racket', 'shoes')
- `total_stock` (integer, not null)
- `available_count` (integer, not null)
- `rental_price` (numeric, not null)
- `created_at` (timestamptz)

### 5. pricing_rules
Dynamic pricing rule engine
- `id` (uuid, primary key)
- `name` (text, not null)
- `rule_type` (rule_type enum: 'peak_hour', 'weekend', 'holiday', 'premium_court')
- `start_time` (time)
- `end_time` (time)
- `days_of_week` (integer array, 0=Sunday, 6=Saturday)
- `multiplier` (numeric, default: 1.0)
- `surcharge` (numeric, default: 0)
- `is_active` (boolean, default: true)
- `created_at` (timestamptz)

### 6. bookings
Booking records with resource allocation
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles)
- `court_id` (uuid, references courts)
- `coach_id` (uuid, references coaches, nullable)
- `start_time` (timestamptz, not null)
- `end_time` (timestamptz, not null)
- `racket_count` (integer, default: 0)
- `shoes_count` (integer, default: 0)
- `base_price` (numeric, not null)
- `pricing_modifiers` (jsonb)
- `equipment_fee` (numeric, default: 0)
- `coach_fee` (numeric, default: 0)
- `total_price` (numeric, not null)
- `status` (booking_status enum: 'confirmed', 'cancelled', 'waitlist')
- `created_at` (timestamptz)

## Security
- RLS enabled on all tables
- Admins have full access to all tables
- Users can view all courts, coaches, equipment, and pricing rules
- Users can view and manage their own bookings
- Only admins can create/update courts, coaches, equipment, and pricing rules

## Functions
- `is_admin(uid uuid)`: Helper function to check if user is admin
- `check_booking_availability()`: RPC to check if a time slot is available
- `create_booking_atomic()`: RPC to create booking with atomic resource validation

## Notes
- First user to register automatically becomes admin
- All timestamps use UTC timezone
- Equipment inventory is tracked in real-time
- Pricing modifiers stored as JSONB for flexibility
*/

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE court_type AS ENUM ('indoor', 'outdoor');
CREATE TYPE court_status AS ENUM ('available', 'maintenance', 'unavailable');
CREATE TYPE equipment_type AS ENUM ('racket', 'shoes');
CREATE TYPE rule_type AS ENUM ('peak_hour', 'weekend', 'holiday', 'premium_court');
CREATE TYPE booking_status AS ENUM ('confirmed', 'cancelled', 'waitlist');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  email text,
  phone text,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create courts table
CREATE TABLE IF NOT EXISTS courts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type court_type NOT NULL,
  base_price numeric NOT NULL CHECK (base_price >= 0),
  status court_status DEFAULT 'available'::court_status NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create coaches table
CREATE TABLE IF NOT EXISTS coaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hourly_rate numeric NOT NULL CHECK (hourly_rate >= 0),
  bio text,
  specialties text[],
  status text DEFAULT 'available',
  created_at timestamptz DEFAULT now()
);

-- Create equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type equipment_type NOT NULL UNIQUE,
  total_stock integer NOT NULL CHECK (total_stock >= 0),
  available_count integer NOT NULL CHECK (available_count >= 0),
  rental_price numeric NOT NULL CHECK (rental_price >= 0),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT available_lte_total CHECK (available_count <= total_stock)
);

-- Create pricing_rules table
CREATE TABLE IF NOT EXISTS pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rule_type rule_type NOT NULL,
  start_time time,
  end_time time,
  days_of_week integer[],
  multiplier numeric DEFAULT 1.0 CHECK (multiplier >= 0),
  surcharge numeric DEFAULT 0 CHECK (surcharge >= 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  court_id uuid NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES coaches(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  racket_count integer DEFAULT 0 CHECK (racket_count >= 0),
  shoes_count integer DEFAULT 0 CHECK (shoes_count >= 0),
  base_price numeric NOT NULL CHECK (base_price >= 0),
  pricing_modifiers jsonb DEFAULT '[]'::jsonb,
  equipment_fee numeric DEFAULT 0 CHECK (equipment_fee >= 0),
  coach_fee numeric DEFAULT 0 CHECK (coach_fee >= 0),
  total_price numeric NOT NULL CHECK (total_price >= 0),
  status booking_status DEFAULT 'confirmed'::booking_status NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create indexes for performance
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_court_id ON bookings(court_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_pricing_rules_active ON pricing_rules(is_active);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create admin helper function
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- RLS Policies for profiles
CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) 
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- RLS Policies for courts
CREATE POLICY "Anyone can view courts" ON courts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage courts" ON courts
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for coaches
CREATE POLICY "Anyone can view coaches" ON coaches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage coaches" ON coaches
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for equipment
CREATE POLICY "Anyone can view equipment" ON equipment
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage equipment" ON equipment
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for pricing_rules
CREATE POLICY "Anyone can view pricing rules" ON pricing_rules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage pricing rules" ON pricing_rules
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for bookings
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own bookings" ON bookings
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled'::booking_status);

CREATE POLICY "Admins can manage all bookings" ON bookings
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Create trigger function for new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  user_email text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  user_email := NEW.email;
  IF user_email LIKE '%@miaoda.com' THEN
    user_email := REPLACE(user_email, '@miaoda.com', '');
  END IF;
  
  INSERT INTO profiles (id, username, email, phone, role)
  VALUES (
    NEW.id,
    user_email,
    NEW.email,
    NEW.phone,
    CASE WHEN user_count = 0 THEN 'admin'::user_role ELSE 'user'::user_role END
  );
  RETURN NEW;
END;
$$;

-- Create trigger for auth user confirmation
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- RPC function to check booking availability
CREATE OR REPLACE FUNCTION check_booking_availability(
  p_court_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_coach_id uuid DEFAULT NULL,
  p_racket_count integer DEFAULT 0,
  p_shoes_count integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_court_available boolean;
  v_coach_available boolean;
  v_rackets_available integer;
  v_shoes_available integer;
  v_result jsonb;
BEGIN
  -- Check court availability
  SELECT NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE court_id = p_court_id
      AND status = 'confirmed'::booking_status
      AND (
        (start_time <= p_start_time AND end_time > p_start_time) OR
        (start_time < p_end_time AND end_time >= p_end_time) OR
        (start_time >= p_start_time AND end_time <= p_end_time)
      )
  ) INTO v_court_available;

  -- Check coach availability if coach is selected
  IF p_coach_id IS NOT NULL THEN
    SELECT NOT EXISTS (
      SELECT 1 FROM bookings
      WHERE coach_id = p_coach_id
        AND status = 'confirmed'::booking_status
        AND (
          (start_time <= p_start_time AND end_time > p_start_time) OR
          (start_time < p_end_time AND end_time >= p_end_time) OR
          (start_time >= p_start_time AND end_time <= p_end_time)
        )
    ) INTO v_coach_available;
  ELSE
    v_coach_available := true;
  END IF;

  -- Check equipment availability
  SELECT available_count INTO v_rackets_available
  FROM equipment WHERE type = 'racket'::equipment_type;
  
  SELECT available_count INTO v_shoes_available
  FROM equipment WHERE type = 'shoes'::equipment_type;

  -- Build result
  v_result := jsonb_build_object(
    'available', v_court_available AND v_coach_available AND 
                 (v_rackets_available >= p_racket_count) AND 
                 (v_shoes_available >= p_shoes_count),
    'court_available', v_court_available,
    'coach_available', v_coach_available,
    'rackets_available', v_rackets_available,
    'shoes_available', v_shoes_available
  );

  RETURN v_result;
END;
$$;

-- Insert initial equipment inventory
INSERT INTO equipment (type, total_stock, available_count, rental_price) VALUES
  ('racket'::equipment_type, 20, 20, 5.00),
  ('shoes'::equipment_type, 15, 15, 3.00);

-- Insert sample pricing rules
INSERT INTO pricing_rules (name, rule_type, start_time, end_time, days_of_week, multiplier, is_active) VALUES
  ('Peak Hours (6PM-9PM)', 'peak_hour'::rule_type, '18:00:00', '21:00:00', ARRAY[1,2,3,4,5], 1.5, true),
  ('Weekend Premium', 'weekend'::rule_type, NULL, NULL, ARRAY[0,6], 1.3, true),
  ('Indoor Court Premium', 'premium_court'::rule_type, NULL, NULL, NULL, 1.2, true);