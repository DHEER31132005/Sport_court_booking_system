# Sports Facility Court Booking Platform - Implementation Plan

## Overview
Building a full-stack sports facility booking platform with multi-resource scheduling, dynamic pricing, and admin management.

## Phase 1: Project Setup & Design System
- [x] Review example code structure
- [x] Set up design system with sports theme colors (blue #2563EB, orange #F97316)
- [x] Configure tailwind.config.js with semantic tokens
- [x] Update index.css with design variables

## Phase 2: Database Schema & Supabase Setup
- [x] Initialize Supabase project
- [x] Create migration for core tables:
  - [x] profiles (with user_role enum)
  - [x] courts (type, base_price, status)
  - [x] coaches (name, hourly_rate, availability)
  - [x] equipment (type, total_stock, available_count)
  - [x] pricing_rules (name, time_range, day_conditions, multiplier)
  - [x] bookings (user, court, time, resources, pricing_breakdown, status)
- [x] Set up RLS policies
- [x] Create RPC functions for availability checking and atomic booking
- [x] Set up auth trigger for profile creation

## Phase 3: Type Definitions & API Layer
- [x] Create TypeScript interfaces in @/types/types.ts
- [x] Set up Supabase client in @/db/supabase.ts
- [x] Create API functions in @/db/api.ts:
  - [x] Court CRUD operations
  - [x] Coach CRUD operations
  - [x] Equipment CRUD operations
  - [x] Pricing rules CRUD operations
  - [x] Booking operations (create, read, cancel)
  - [x] Availability checking
  - [x] Price calculation

## Phase 4: Authentication & Authorization
- [x] Create Login page with username/password
- [x] Set up auth hooks (useAuth)
- [x] Implement route guards
- [x] Add login status to header
- [x] Create logout functionality
- [x] Disable email verification for username-based auth

## Phase 5: User Booking Interface
- [x] Create Booking page with:
  - [x] Date selector
  - [x] Court selection grid
  - [x] Time slot selector
  - [x] Equipment selection (rackets, shoes)
  - [x] Coach selection
  - [x] Live price calculator display
  - [x] Price breakdown component
  - [x] Booking confirmation
- [x] Implement availability checking logic
- [x] Add real-time price updates
- [x] Create booking submission flow

## Phase 6: User Dashboard
- [x] Create My Bookings page
- [x] Display user's booking history
- [x] Add booking cancellation functionality
- [x] Show booking status (confirmed/cancelled/waitlist)

## Phase 7: Admin Dashboard
- [x] Create Admin page with tabs:
  - [x] Courts management (add, edit, delete)
  - [x] Coaches management (add, edit, availability)
  - [x] Equipment inventory management
  - [x] Pricing rules management
  - [x] All bookings overview
  - [x] Users management
- [x] Implement admin-only route guard
- [x] Add admin navigation link

## Phase 8: Routing & Navigation
- [x] Set up routes.tsx with all pages
- [x] Create Header component with navigation
- [x] Implement 404 redirect

## Phase 9: Testing & Validation
- [x] Run npm run lint and fix issues

## Phase 10: Final Polish
- [x] Add loading states
- [x] Add error handling with toast notifications
- [x] Ensure all forms have validation
- [x] Add confirmation dialogs for destructive actions
- [x] Final UI polish and spacing adjustments

## Completed!
All features have been successfully implemented. The platform is ready for use.

## Notes
- First registered user becomes admin automatically
- Use username + password auth (simulated with @miaoda.com emails)
- All database operations include null checks and return type validation
- Uses semantic color tokens only (no direct Tailwind colors)
- Desktop-first design with mobile adaptation
