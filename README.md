# Sports Facility Court Booking Platform

A full-stack web application for managing sports facility bookings with multi-resource scheduling, dynamic pricing, and waitlist functionality.

## Features

### Core Features
- **Multi-Resource Booking**: Book courts, equipment (rackets/shoes), and coaches in a single atomic transaction
- **Dynamic Pricing Engine**: Real-time price calculation based on configurable rules (peak hours, weekends, premium courts)
- **Availability Checking**: Automatic conflict detection across all resource types
- **User Booking Interface**: Intuitive booking flow with live price updates
- **Admin Dashboard**: Comprehensive management of courts, coaches, equipment, pricing rules, and bookings

### Bonus Features
- **Concurrent Booking Prevention**: Database-level constraints and RLS policies prevent double booking
- **Waitlist System**: Users can join waitlist when slots are full; automatic notification on cancellation

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **State Management**: React Hooks + Context API
- **Routing**: React Router v6
- **Date Handling**: date-fns
- **Notifications**: Sonner (toast notifications)

## Setup Instructions

### Prerequisites
- Node.js 18+ and pnpm installed
- Supabase account (project already initialized)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd app-83f1dspnzo5d
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment variables**
   The `.env` file is already configured with Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://ohetejkiirjlcezacmgo.supabase.co
   VITE_SUPABASE_ANON_KEY=<key>
   ```

4. **Database setup**
   The database is already initialized with:
   - All tables (profiles, courts, coaches, equipment, pricing_rules, bookings, waitlist)
   - RLS policies for security
   - RPC functions for availability checking and pricing
   - Seed data for equipment and pricing rules

5. **Run the application**
   ```bash
   pnpm run dev
   ```
   The app will be available at the deployment URL.

## Seed Data

The database includes the following seed data:

### Equipment
- **Rackets**: 10 total stock, $5 rental price
- **Shoes**: 8 total stock, $3 rental price

### Pricing Rules
- **Peak Hours**: 6 PM - 9 PM, 1.5x multiplier (Mon-Fri)
- **Weekend Premium**: Saturday-Sunday, 1.3x multiplier
- **Indoor Premium**: Indoor courts, 1.2x multiplier

### User Accounts
- First registered user automatically becomes admin
- Use username + password authentication (simulated with @miaoda.com emails)

## Usage Guide

### For Users

1. **Sign Up / Login**
   - Navigate to `/login`
   - Create account with username and password
   - First user becomes admin automatically

2. **Book a Court**
   - Go to "Book a Court" page
   - Select date, time, and court
   - Optionally add equipment and coach
   - See live price calculation
   - Confirm booking

3. **Join Waitlist**
   - If a slot is full, click "Join Waitlist"
   - You'll be notified when the slot becomes available
   - View your waitlist position

4. **View Bookings**
   - Go to "My Bookings" to see all your bookings
   - Cancel bookings if needed
   - View booking details and pricing breakdown

### For Admins

1. **Manage Courts**
   - Add/edit/delete courts
   - Set base prices and status
   - Configure court types (indoor/outdoor)

2. **Manage Coaches**
   - Add/edit/delete coaches
   - Set hourly rates and specialties
   - Update availability status

3. **Manage Equipment**
   - Update inventory counts
   - Adjust rental prices
   - Track availability

4. **Configure Pricing Rules**
   - Create time-based pricing rules
   - Set multipliers and surcharges
   - Enable/disable rules dynamically

5. **View All Bookings**
   - Monitor all facility bookings
   - View booking details and revenue

6. **Manage Waitlist**
   - View all waitlist entries
   - Monitor waitlist positions and status

7. **Manage Users**
   - View all registered users
   - Change user roles (user/admin)

## Project Structure

```
src/
├── components/
│   ├── admin/              # Admin management components
│   │   ├── CourtsManagement.tsx
│   │   ├── CoachesManagement.tsx
│   │   ├── EquipmentManagement.tsx
│   │   ├── PricingRulesManagement.tsx
│   │   ├── BookingsManagement.tsx
│   │   ├── UsersManagement.tsx
│   │   └── WaitlistManagement.tsx
│   ├── common/             # Shared components
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── ui/                 # shadcn/ui components
├── db/
│   ├── supabase.ts         # Supabase client
│   └── api.ts              # API functions
├── pages/
│   ├── Home.tsx            # Landing page
│   ├── Booking.tsx         # Booking interface
│   ├── MyBookings.tsx      # User bookings
│   ├── Admin.tsx           # Admin dashboard
│   └── Login.tsx           # Authentication
├── types/
│   └── types.ts            # TypeScript interfaces
├── routes.tsx              # Route configuration
└── App.tsx                 # Main app component
```

## Database Schema

See `supabase/migrations/` for complete schema definitions.

### Key Tables
- **profiles**: User profiles with role-based access
- **courts**: Court information and pricing
- **coaches**: Coach profiles and rates
- **equipment**: Equipment inventory
- **pricing_rules**: Dynamic pricing configuration
- **bookings**: Booking records with pricing breakdown
- **waitlist**: Waitlist entries with position tracking

### Security
- Row Level Security (RLS) enabled on all tables
- Admin-only access for management operations
- Users can only view/modify their own data
- Database-level constraints prevent double booking

## Key Features Implementation

### Multi-Resource Booking
- Atomic transaction ensures all resources are available
- Availability check validates court, coach, and equipment
- Booking fails if any resource is unavailable

### Dynamic Pricing Engine
- Modular pricing rule system
- Rules can stack (e.g., peak + weekend + indoor)
- Real-time calculation on frontend
- Pricing breakdown shows all applied modifiers

### Concurrent Booking Prevention
- Unique index on (court_id, start_time, end_time) for confirmed bookings
- RLS policies enforce access control
- RPC functions provide atomic operations
- Database-level constraints prevent race conditions

### Waitlist System
- Position-based queue management
- Automatic notification on cancellation
- Users can view their position in queue
- Admin can monitor all waitlist entries

## API Endpoints (RPC Functions)

- `check_booking_availability`: Validate resource availability
- `join_waitlist`: Add user to waitlist
- `get_waitlist_position`: Get user's position in queue
- `cancel_booking_with_waitlist`: Cancel booking and process waitlist
- `process_waitlist_on_cancellation`: Notify next person in queue

## Development

### Linting
```bash
pnpm run lint
```

### Build
```bash
pnpm run build
```

## Assumptions Made

1. **Time Slots**: Bookings can be made for any time range (not restricted to fixed slots)
2. **Equipment Rental**: Equipment is rented for the entire booking duration
3. **Coach Availability**: Coaches are marked as available/unavailable globally (not time-specific)
4. **Pricing Rules**: Rules are evaluated in order and can stack
5. **Waitlist**: First-come-first-served basis; notified users have limited time to book
6. **Authentication**: Username-based auth simulated with email format (username@miaoda.com)
7. **Cancellation**: Users can cancel their own bookings; admins can cancel any booking
8. **Equipment Tracking**: Equipment availability is tracked but not assigned to specific items

## Future Enhancements

- Email/SMS notifications for waitlist
- Calendar view for availability
- Recurring bookings
- Payment integration
- Coach-specific availability schedules
- Equipment maintenance tracking
- Booking history analytics
- Mobile app

## License

MIT

## Support

For issues or questions, please open an issue in the repository.
