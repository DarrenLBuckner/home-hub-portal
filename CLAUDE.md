# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Guyana Home Hub Portal is a Next.js application built as the backend management system for real estate agents, FSBO sellers, and landlords to manage property listings. Properties created here sync to the public Guyana Home Hub website. The stack includes:

- **Next.js 15** with App Router and TypeScript
- **Supabase** for authentication, database, and backend services
- **Stripe** for payment processing
- **Resend** for email notifications
- **TailwindCSS** for styling
- **Zod** for form validation

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production (includes prebuild script that cleans tsconfig)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture

### Directory Structure
- `src/app/` - Next.js App Router pages and layouts
  - `api/` - API routes for backend functionality
  - `dashboard/` - Protected admin dashboard
  - `properties/` - Property management pages
  - `register/` - User registration flow
- `src/components/` - Reusable React components
- `src/lib/` - Utility functions and configurations
  - `auth.ts` - Authentication helpers and role verification
  - `supabase/` - Supabase client configurations
- `src/types/` - TypeScript type definitions
- `supabase/` - Database migrations and SQL scripts

### Authentication & Authorization
- Uses Supabase Auth with middleware for session management
- Role-based access control through `profiles.user_type` field
- Authentication helpers in `src/lib/auth.ts` for role verification
- Middleware in `src/middleware.ts` handles auth state across routes

### Key Features
- Multi-user types: agents, FSBO sellers, landlords, admins
- Property listing management with image uploads
- Payment processing via Stripe integration
- Email notifications via Resend for application status updates
- Admin dashboard for user and listing approval workflows

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for admin operations
- `STRIPE_PUBLIC_KEY` and `STRIPE_SECRET_KEY` - Stripe payment keys
- `RESEND_API_KEY` - For email notifications

## Configuration Notes

- TypeScript and ESLint errors are ignored during builds (`next.config.js`)
- Custom prebuild script removes `.next/types/**/*.ts` from tsconfig before builds
- Path alias `@/*` maps to `src/*`
- Supabase client configurations handle both client and server-side operations

## Database

Supabase PostgreSQL with tables for:
- `profiles` - User profiles with role-based typing
- Property-related tables managed through the dashboard
- Countries table for location data