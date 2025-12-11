# Technical Write-Up: Database Design and Pricing Engine

## Database Design Approach

### Schema Architecture

The database schema is designed around **resource-centric modeling** with clear separation of concerns. The core principle is to treat courts, coaches, and equipment as independent resources that can be composed into bookings.

#### Key Design Decisions:

1. **Normalized Resource Tables**
   - Each resource type (courts, coaches, equipment) has its own table with specific attributes
   - This allows independent management and scaling of each resource type
   - Equipment uses a type-based approach (racket/shoes) rather than individual item tracking for simplicity

2. **Booking as Composition**
   - The `bookings` table acts as a composition layer, referencing multiple resources
   - Stores denormalized pricing data (base_price, modifiers, fees) for historical accuracy
   - Uses JSONB for `pricing_modifiers` to maintain flexibility while preserving calculation details

3. **Waitlist as Parallel Structure**
   - Separate `waitlist` table mirrors booking structure but with queue management
   - Position-based ordering ensures fair first-come-first-served processing
   - Status tracking (waiting/notified/expired) enables workflow management

### Concurrency Control

**Multi-Layer Protection Against Double Booking:**

1. **Database Constraints**
   ```sql
   CREATE UNIQUE INDEX idx_bookings_no_overlap 
   ON bookings(court_id, start_time, end_time) 
   WHERE status = 'confirmed';
   ```
   This unique index prevents two confirmed bookings for the same court at the same time at the database level.

2. **Row Level Security (RLS)**
   - Policies enforce that users can only create bookings for themselves
   - Admin-only access for management operations
   - Prevents unauthorized modifications

3. **RPC Functions with SECURITY DEFINER**
   - Atomic operations encapsulated in PostgreSQL functions
   - `check_booking_availability` validates all resources in a single transaction
   - Prevents race conditions between check and insert

4. **Application-Level Validation**
   - Frontend checks availability before submission
   - Backend validates again before committing
   - Provides immediate feedback to users

### Availability Checking Logic

The `check_booking_availability` RPC function implements efficient multi-resource validation:

```sql
-- Check court availability (no overlapping confirmed bookings)
SELECT COUNT(*) FROM bookings 
WHERE court_id = p_court_id 
  AND status = 'confirmed'
  AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time);

-- Check coach availability (if coach selected)
SELECT COUNT(*) FROM bookings 
WHERE coach_id = p_coach_id 
  AND status = 'confirmed'
  AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time);

-- Check equipment availability (count current usage)
SELECT COUNT(*) * racket_count FROM bookings 
WHERE status = 'confirmed'
  AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time);
```

This approach uses PostgreSQL's native `OVERLAPS` operator for efficient time range comparisons.

## Pricing Engine Architecture

### Design Philosophy

The pricing engine is built on a **rule-based, composable architecture** that separates pricing logic from business logic. This enables non-technical admins to configure pricing without code changes.

### Core Components:

1. **Pricing Rules Table**
   - Stores configurable rules with conditions and modifiers
   - Each rule has:
     - Type (peak_hour, weekend, holiday, premium_court)
     - Time constraints (start_time, end_time)
     - Day constraints (days_of_week array)
     - Pricing impact (multiplier or surcharge)
     - Active status (enable/disable without deletion)

2. **Rule Evaluation Engine**
   - Implemented in `pricingApi.calculatePrice()`
   - Evaluates rules in order, applying all matching rules
   - Rules can stack (e.g., peak + weekend + indoor all apply)

3. **Calculation Flow**
   ```
   Base Price = Court Base Rate × Hours
   ↓
   Apply Pricing Rules (multipliers and surcharges)
   ↓
   Add Equipment Fees (rackets + shoes)
   ↓
   Add Coach Fee (coach rate × hours)
   ↓
   Total Price
   ```

### Rule Matching Logic

Rules are evaluated based on booking context:

```typescript
// Peak Hour Rule
if (rule.rule_type === 'peak_hour' && rule.start_time && rule.end_time) {
  if (timeStr >= rule.start_time && timeStr < rule.end_time) {
    if (!rule.days_of_week || rule.days_of_week.includes(dayOfWeek)) {
      applies = true;
    }
  }
}

// Weekend Rule
if (rule.rule_type === 'weekend') {
  if (rule.days_of_week && rule.days_of_week.includes(dayOfWeek)) {
    applies = true;
  }
}

// Premium Court Rule
if (rule.rule_type === 'premium_court') {
  if (court.type === 'indoor') {
    applies = true;
  }
}
```

### Pricing Transparency

The system maintains complete transparency by:
- Storing pricing breakdown in booking records
- Showing real-time calculation on booking form
- Displaying each modifier with its contribution
- Preserving historical pricing even if rules change later

### Extensibility

The rule-based system allows easy addition of new pricing strategies:
- Holiday pricing (specific dates)
- Member discounts (user-based rules)
- Seasonal pricing (date range rules)
- Group booking discounts (quantity-based rules)

All without modifying core application code—just add new rule types and evaluation logic.

## Waitlist Implementation

### Queue Management

The waitlist system uses a position-based queue:

1. **Joining Waitlist**
   - User requests to join for a specific slot
   - System assigns next position number
   - Position is immutable once assigned

2. **Processing on Cancellation**
   - When a booking is cancelled, `cancel_booking_with_waitlist` RPC is called
   - Automatically finds the first person in queue (lowest position)
   - Updates their status to 'notified'
   - Records notification timestamp

3. **User Experience**
   - Users see their position in queue
   - Total waiting count provides context
   - Status updates show progression (waiting → notified)

### Notification Flow

```
Booking Cancelled
↓
Trigger: cancel_booking_with_waitlist()
↓
Find: Next person in waitlist (position = MIN)
↓
Update: Status = 'notified', notified_at = NOW()
↓
Return: Notified user ID for external notification
```

The system returns the notified user ID, enabling future integration with email/SMS services.

## Performance Considerations

1. **Indexes**
   - `idx_bookings_court_time`: Fast lookup for availability checks
   - `idx_waitlist_court_time`: Efficient waitlist queries
   - `idx_bookings_no_overlap`: Enforces uniqueness and speeds up conflict detection

2. **Query Optimization**
   - Use of `OVERLAPS` operator for time range comparisons
   - Selective indexes with `WHERE status = 'confirmed'` clause
   - JSONB for flexible data without schema changes

3. **Caching Strategy**
   - Pricing rules cached on frontend after first load
   - Equipment inventory refreshed on booking page load
   - Court/coach lists cached with periodic refresh

## Security Model

1. **Row Level Security (RLS)**
   - Users can only view/modify their own bookings and waitlist entries
   - Admins have full access via `is_admin()` helper function
   - Prevents horizontal privilege escalation

2. **RPC Security**
   - Functions use `SECURITY DEFINER` to run with elevated privileges
   - Input validation prevents SQL injection
   - Authorization checks within functions

3. **Data Integrity**
   - Check constraints on time ranges, counts, and prices
   - Foreign key constraints maintain referential integrity
   - Enum types enforce valid status values

## Conclusion

This architecture provides a robust, scalable foundation for a sports facility booking system. The separation of concerns between resources, bookings, and pricing enables independent evolution of each component. The rule-based pricing engine offers flexibility without code changes, while the multi-layer concurrency control ensures data integrity even under high load.

The waitlist system adds a customer-friendly feature that maximizes facility utilization and user satisfaction. All components are designed with extensibility in mind, allowing future enhancements without major refactoring.