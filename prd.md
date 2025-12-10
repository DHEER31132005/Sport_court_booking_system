# Sports Facility Court Booking Platform Requirements Document

## 1. Application Overview

### 1.1 Application Name\nSports Facility Court Booking Platform

### 1.2 Application Description
A full-stack web application designed to manage complex scheduling and resource allocation for a sports facility with4 badminton courts (2 indoor, 2 outdoor), limited equipment inventory (rackets and shoes), and 3 coaches with individual availability. The platform features a dynamic pricing engine that calculates costs in real-time based on configurable rules that can stack (e.g., indoor + peak hours + weekend), and supports concurrent booking handling with waitlist functionality.

## 2. Core Features

### 2.1 Multi-Resource Booking System
- **Court Management**:4 badminton courts (2 indoor, 2 outdoor) with availability tracking
- **Equipment Inventory**: Limited quantity of rackets and shoes with real-time availability\n- **Coach Scheduling**: 3 coaches with individual availability schedules
- **Atomic Booking**: All selected resources (court + equipment + coach) must be available simultaneously; booking is all-or-nothing
- **Conflict Detection**: Automatic checking of overlapping bookings across all resource types
\n### 2.2 Dynamic Pricing Engine
- **Configurable Base Pricing**: Admin-defined base rates for different court types
- **Stackable Pricing Rules**: Multiple rules can apply simultaneously:\n  - Peak hours (6PM-9PM) → higher rate
  - Weekends → higher rate
  - Indoor courts → premium pricing
  - Equipment rental fees\n  - Coach fees
- **Rule Stacking Logic**: All applicable rules combine (e.g., indoor + peak + weekend all apply together)
- **Real-Time Calculation**: Live price updates as users select time slots and resources
- **Transparent Breakdown**: Display base price, each applied modifier, equipment fees, coach fees, and total cost
- **Configuration-Driven**: Pricing logic driven by admin configurations, not hardcoded

### 2.3 User Booking Interface
- **Slot Availability View**: Display available slots for a selected date
- **Resource Selection**: Choose court, add optional equipment (rackets/shoes), add optional coach
- **Live Price Display**: Real-time price breakdown updates as options are selected
- **Booking Confirmation**: Submit atomic bookings with status tracking
- **Booking History**: View past and upcoming bookings

### 2.4 Admin Configuration Panel
- **Court Management**: Add, edit, disable courts with base pricing configuration
- **Equipment Inventory**: Update total stock counts and manage availability
- **Coach Management**: Create coach profiles, set individual availability schedules
- **Pricing Rules Management**: Create, update, enable/disable pricing rules with stacking logic
- **Booking Overview**: View and manage all bookings across the facility\n
### 2.5 Availability Logic
- **Multi-Resource Validation**: Check simultaneous availability of court, equipment, and coach
- **Overlap Detection**: Query existing bookings to prevent double-booking
- **Time Range Validation**: Verify no conflicts with confirmed bookings
- **Equipment Capacity Check**: Ensure inventory limits are not exceeded
- **Efficient Queries**: Optimized database queries across multiple resource types

### 2.6 Concurrent Booking Handling (Bonus)
- **Race Condition Prevention**: Handle simultaneous booking attempts for the same resources
- **Transaction Locking**: Implement database-level locking or optimistic concurrency control
- **Conflict Resolution**: First successful transaction wins; others receive unavailable notification
\n### 2.7 Waitlist System (Bonus)
- **Waitlist Enrollment**: Users can join waitlist when slot is fully booked
- **Queue Management**: Maintain ordered waitlist per time slot
- **Automatic Notification**: On cancellation, immediately notify next person in queue
- **Waitlist Expiration**: Time-limited response window for waitlist notifications

## 3. Technical Architecture

### 3.1 Technology Stack
- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL (with Sequelize/TypeORM) for transaction support and concurrency handling
- **API Testing**: Postman or Insomnia\n- **Version Control**: Git & GitHub

### 3.2 Project Structure
```
/root
  ├── /backend
  │    ├── /config         # Database connection setup
  │    ├── /controllers    # Business logic (calculatePrice, createBooking, handleWaitlist)
  │    ├── /models         # Database schemas (Court, Booking, PricingRule, Coach, Equipment, Waitlist)
  │    ├── /routes         # API endpoints (api/bookings, api/courts, api/coaches, api/waitlist)
  │    ├── /middleware     # Authentication, error handling, concurrency control
  │    ├── /services# Pricing engine, availability checker, notification service
  │    └── server.js       # Application entry point
  │
  ├── /frontend
  │    ├── /public
  │    ├── /src
  │    │    ├── /components  # Reusable UI components (Button, Calendar, Modal, PriceBreakdown)
  │    │    ├── /pages       # Full page screens (BookingPage, AdminDashboard, BookingHistory)
  │    │    ├── /services    # API integration (axios/fetch functions)\n  │    │    └── App.js
  │    └── package.json
  │
  └── README.md            # Setup instructions, assumptions, design explanations
```

### 3.3 Database Schema Design

**Court Schema**:
- Court ID\n- Court type (indoor/outdoor)
- Base price
- Status (active/disabled)
\n**Equipment Schema**:
- Equipment type (rackets/shoes)
- Total stock count
- Current available count

**Coach Schema**:
- Coach ID
- Coach name
- Availability schedule (JSON or separate availability table)
- Hourly rate

**Booking Schema**:
- Booking ID
- User reference
- Court reference
- Start time and end time
- Resources object (rackets count, shoes count, coach reference)
- Status (confirmed/cancelled/waitlist)
- Pricing breakdown (base price, applied rules array, equipment fee, coach fee, total)
- Created timestamp
- Version number (for optimistic locking)

**Pricing Rule Schema**:
- Rule ID\n- Rule name
- Rule type (peak_hour/weekend/court_premium/equipment/coach)
- Conditions (time range, day type, court type)
- Price modifier (multiplier or fixed surcharge)
- Enabled status
- Priority (for rule application order)

**Waitlist Schema** (Bonus):
- Waitlist ID
- User reference
- Court reference
- Desired time slot
- Position in queue
- Status (active/notified/expired/converted)
- Created timestamp
\n### 3.4 Key API Endpoints
- `GET /courts` - List all active courts
- `POST /admin/courts` - Add new court\n- `PUT /admin/courts/:id` - Edit court details
- `PATCH /admin/courts/:id/disable` - Disable court
- `GET /coaches` - List available coaches
- `POST /admin/coaches` - Add coach profile
- `PUT /admin/coaches/:id/availability` - Update coach availability
- `GET /equipment` - Check equipment inventory
- `PUT /admin/equipment/:type` - Update equipment stock
- `POST /bookings` - Create new booking (with concurrency handling)
- `GET /bookings/availability` - Check slot availability for date
- `GET /bookings/history` - User booking history
- `DELETE /bookings/:id` - Cancel booking (triggers waitlist notification)
- `GET /pricing/calculate` - Calculate price for selected resources and time\n- `POST /admin/pricing-rules` - Create pricing rule
- `PUT /admin/pricing-rules/:id` - Update pricing rule
- `PATCH /admin/pricing-rules/:id/toggle` - Enable/disable pricing rule
- `POST /waitlist` - Join waitlist (Bonus)
- `GET /waitlist/:userId` - Get user waitlist entries (Bonus)

## 4. Core Logic Implementation
\n### 4.1 Availability Check Algorithm
- Query database for existing confirmed bookings on requested court and time slot
- Check for time overlap using conditions:
  - New booking starts during existing booking
  - New booking ends during existing booking
  - New booking wraps around existing booking
- Verify selected coach availability for same time slot
- Check equipment inventory: calculate current bookings' equipment usage and compare against total stock
- Return availability status for all resources with efficient multi-table queries

### 4.2 Pricing Calculation Flow
1. Fetch base price for selected court type
2. Retrieve all enabled pricing rules from database ordered by priority
3. Evaluate each rule's conditions against booking parameters (time, day, court type)
4. Apply all matching rules (stacking logic):
   - Peak hour multiplier if time falls in6PM-9PM\n   - Weekend multiplier if day is Saturday/Sunday
   - Indoor premium if court type is indoor
5. Add equipment rental fees (rackets + shoes)
6. Add coach fee if coach selected
7. Return total with detailed breakdown showing each applied rule

### 4.3 Concurrent Booking Handling (Bonus)\n- Use database transactions with row-level locking
- Implement optimistic locking with version numbers
- On booking attempt:\n  1. Start transaction
  2. Lock relevant resource rows (court, equipment, coach)
  3. Re-check availability within transaction
  4. If available, create booking and update resource counts
  5. Commit transaction
  6. If conflict detected, rollback and return error

### 4.4 Waitlist Management (Bonus)
- On booking cancellation:\n  1. Query waitlist for matching time slot ordered by position
  2. Notify first person in queue via email/SMS
  3. Set notification timestamp and expiration time
  4. If user confirms within time window, convert to confirmed booking
  5. If expired, move to next person in queue
\n## 5. Design Style\n
- **Color Scheme**: Professional sports theme with primary blue (#2563EB) for trust and reliability, energetic orange (#F97316) for call-to-action buttons, neutral gray backgrounds (#F3F4F6) for clean readability
- **Layout**: Card-based design for booking slots with clear grid structure for calendar view, sidebar navigation for admin dashboard with collapsible sections\n- **Visual Elements**: Rounded corners (8px radius) for modern feel, subtle shadows (02px 4px rgba(0,0,0,0.1)) for depth, color-coded status indicators (green for available, red for booked, yellow for waitlist, blue for selected)
- **Typography**: Inter or similar sans-serif font with bold headings (font-weight: 600) for section clarity, adequate line-height (1.6) for form readability
- **Interactive Feedback**: Smooth transitions (200ms ease) on hover states, real-time price updates with subtle highlight animation, loading spinners for async operations, disabled state styling for unavailable slots

## 6. Development Phases

### Phase 1: Database Modeling\n- Design and implement all database schemas with relationships
- Set up seed data for 4 courts (2 indoor, 2 outdoor), equipment inventory, 3 coaches, and sample pricing rules
- Configure database indexes for efficient availability queries

### Phase 2: Backend API Development
- Initialize Node.js server with Express and database connection
- Implement CRUD operations for courts, equipment, coaches, pricing rules\n- Build authentication middleware\n\n### Phase 3: Availability Logic Implementation
- Develop multi-resource availability checker with efficient queries
- Implement overlap detection algorithm
- Create atomic transaction handling for bookings

### Phase 4: Pricing Engine Development
- Build modular pricing calculator service
- Implement rule evaluation and stacking logic
- Create real-time price calculation API with breakdown\n- Ensure pricing is configuration-driven, not hardcoded

### Phase 5: Frontend Development\n- Build date selector and slot availability view
- Create interactive booking form with resource selection
- Implement live price display with breakdown component
- Develop booking submission flow with confirmation
- Build booking history page\n
### Phase 6: Admin Dashboard
- Create configuration forms for courts, equipment, coaches
- Build pricing rules management interface with enable/disable toggles
- Implement booking overview with filtering and search
\n### Phase 7: Concurrent Booking & Waitlist (Bonus)
- Implement database locking and optimistic concurrency control
- Build waitlist enrollment and queue management
- Create notification service for waitlist alerts
- Develop waitlist conversion flow

## 7. Deliverables

### 7.1 Git Repository
- Complete source code with clear commit history
- README.md with:\n  - Setup instructions (dependencies, environment variables, database setup)
  - How to run the application (backend and frontend)
  - Assumptions made during development
\n### 7.2 Seed Data
- 4 badminton courts (2 indoor with premium pricing, 2 outdoor with standard pricing)
- Equipment inventory (e.g., 10 rackets, 15 pairs of shoes)
- 3 coach profiles with sample availability schedules
- Sample pricing rules (peak hours, weekend, indoor premium)

### 7.3 Design Write-Up (300-500 words)
**Database Design Approach**:
Explain the schema design decisions, relationships between tables, and how the structure supports multi-resource booking and efficient availability queries.

**Pricing Engine Approach**:
Describe the modular pricing calculator architecture, how rules are evaluated and stacked, and how the system remains flexible for future rule additions without code changes.