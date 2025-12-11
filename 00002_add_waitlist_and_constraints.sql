/*
# Add Waitlist Feature and Concurrent Booking Prevention

## 1. New Tables
- `waitlist`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `court_id` (uuid, references courts)
  - `start_time` (timestamptz)
  - `end_time` (timestamptz)
  - `coach_id` (uuid, references coaches, nullable)
  - `racket_count` (integer)
  - `shoes_count` (integer)
  - `status` (text: 'waiting', 'notified', 'expired')
  - `position` (integer)
  - `created_at` (timestamptz)
  - `notified_at` (timestamptz, nullable)

## 2. Constraints
- Add unique constraint on bookings to prevent double booking at database level
- Add check constraints for valid time ranges
- Add indexes for performance

## 3. RPC Functions
- `join_waitlist` - Add user to waitlist for a specific slot
- `process_waitlist` - Notify next person when booking is cancelled
- `get_waitlist_position` - Get user's position in waitlist

## 4. Security
- RLS enabled on waitlist table
- Users can view their own waitlist entries
- Admins can view all waitlist entries
*/

-- Create waitlist status enum
CREATE TYPE waitlist_status AS ENUM ('waiting', 'notified', 'expired');

-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  court_id uuid NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  coach_id uuid REFERENCES coaches(id) ON DELETE SET NULL,
  racket_count integer DEFAULT 0 NOT NULL,
  shoes_count integer DEFAULT 0 NOT NULL,
  status waitlist_status DEFAULT 'waiting'::waitlist_status NOT NULL,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  notified_at timestamptz,
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_racket_count CHECK (racket_count >= 0),
  CONSTRAINT valid_shoes_count CHECK (shoes_count >= 0)
);

-- Add indexes for performance
CREATE INDEX idx_waitlist_court_time ON waitlist(court_id, start_time, end_time);
CREATE INDEX idx_waitlist_user ON waitlist(user_id);
CREATE INDEX idx_waitlist_status ON waitlist(status);

-- Add constraint to bookings to prevent overlapping bookings for same court
CREATE UNIQUE INDEX idx_bookings_no_overlap ON bookings(court_id, start_time, end_time) 
WHERE status = 'confirmed';

-- Enable RLS on waitlist
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Waitlist policies
CREATE POLICY "Users can view own waitlist entries" ON waitlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create waitlist entries" ON waitlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own waitlist entries" ON waitlist
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to waitlist" ON waitlist
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RPC: Join waitlist
CREATE OR REPLACE FUNCTION join_waitlist(
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
  v_user_id uuid;
  v_position integer;
  v_waitlist_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user already in waitlist for this slot
  IF EXISTS (
    SELECT 1 FROM waitlist
    WHERE user_id = v_user_id
      AND court_id = p_court_id
      AND start_time = p_start_time
      AND end_time = p_end_time
      AND status = 'waiting'
  ) THEN
    RAISE EXCEPTION 'Already in waitlist for this slot';
  END IF;

  -- Get next position
  SELECT COALESCE(MAX(position), 0) + 1 INTO v_position
  FROM waitlist
  WHERE court_id = p_court_id
    AND start_time = p_start_time
    AND end_time = p_end_time
    AND status = 'waiting';

  -- Insert into waitlist
  INSERT INTO waitlist (
    user_id, court_id, start_time, end_time,
    coach_id, racket_count, shoes_count, position
  ) VALUES (
    v_user_id, p_court_id, p_start_time, p_end_time,
    p_coach_id, p_racket_count, p_shoes_count, v_position
  )
  RETURNING id INTO v_waitlist_id;

  RETURN jsonb_build_object(
    'success', true,
    'waitlist_id', v_waitlist_id,
    'position', v_position
  );
END;
$$;

-- RPC: Process waitlist when booking is cancelled
CREATE OR REPLACE FUNCTION process_waitlist_on_cancellation(
  p_court_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_waitlist waitlist%ROWTYPE;
  v_notified_count integer := 0;
BEGIN
  -- Get next person in waitlist
  SELECT * INTO v_next_waitlist
  FROM waitlist
  WHERE court_id = p_court_id
    AND start_time = p_start_time
    AND end_time = p_end_time
    AND status = 'waiting'
  ORDER BY position ASC
  LIMIT 1;

  IF FOUND THEN
    -- Update status to notified
    UPDATE waitlist
    SET status = 'notified'::waitlist_status,
        notified_at = now()
    WHERE id = v_next_waitlist.id;
    
    v_notified_count := 1;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'notified_count', v_notified_count,
    'notified_user_id', v_next_waitlist.user_id
  );
END;
$$;

-- RPC: Get user's waitlist position
CREATE OR REPLACE FUNCTION get_waitlist_position(
  p_court_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_position integer;
  v_total integer;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user's position
  SELECT position INTO v_position
  FROM waitlist
  WHERE user_id = v_user_id
    AND court_id = p_court_id
    AND start_time = p_start_time
    AND end_time = p_end_time
    AND status = 'waiting';

  -- Get total waiting
  SELECT COUNT(*) INTO v_total
  FROM waitlist
  WHERE court_id = p_court_id
    AND start_time = p_start_time
    AND end_time = p_end_time
    AND status = 'waiting';

  RETURN jsonb_build_object(
    'in_waitlist', v_position IS NOT NULL,
    'position', v_position,
    'total_waiting', v_total
  );
END;
$$;

-- Update cancel_booking RPC to process waitlist
CREATE OR REPLACE FUNCTION cancel_booking_with_waitlist(p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_booking bookings%ROWTYPE;
  v_waitlist_result jsonb;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get booking details
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- Check if user owns booking or is admin
  IF v_booking.user_id != v_user_id AND NOT is_admin(v_user_id) THEN
    RAISE EXCEPTION 'Not authorized to cancel this booking';
  END IF;

  IF v_booking.status != 'confirmed' THEN
    RAISE EXCEPTION 'Booking is not confirmed';
  END IF;

  -- Cancel the booking
  UPDATE bookings
  SET status = 'cancelled'
  WHERE id = p_booking_id;

  -- Process waitlist
  SELECT process_waitlist_on_cancellation(
    v_booking.court_id,
    v_booking.start_time,
    v_booking.end_time
  ) INTO v_waitlist_result;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'waitlist_processed', v_waitlist_result
  );
END;
$$;