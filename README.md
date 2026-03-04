# TripSlip Platform

[![Test Coverage](https://img.shields.io/badge/coverage-70%25-brightgreen)](./docs/test-coverage-plan.md)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](./DATABASE_TEST_STATUS.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)

Digital field trip management platform connecting venues, schools, teachers, and parents through a unified ecosystem. Built with a modern monorepo architecture using Turborepo.

## Overview

TripSlip streamlines the entire field trip experience from planning to execution through five specialized web applications, supporting flexible organizational hierarchies from independent teachers to multi-district systems:

- **Landing App** (`tripslip.com`) - Public marketing website with pricing and features
- **Venue App** (`venue.tripslip.com`) - Venue management, experience creation, and booking management
- **School App** (`school.tripslip.com`) - District/school administration, teacher management, and trip approvals
- **Teacher App** (`teacher.tripslip.com`) - Trip planning, venue search, roster management, and permission tracking
- **Parent App** (`parent.tripslip.com`) - Permission slips, payments, and trip information

All applications share a unified Supabase backend with PostgreSQL database (40+ tables), authentication, storage, and edge functions. The platform supports English, Spanish, and Arabic with full RTL support.

### Organizational Hierarchy

TripSlip supports flexible organizational structures where teachers can operate independently or join schools and districts:

```
Platform Admin (TripSlip)
    ↓
Districts (optional)
    ↓ manages multiple schools
Schools (optional)
    ↓ manages teachers
Teachers (can operate independently)
    ↓ manage students
Students & Parents
```

**Key Features:**
- Teachers can create trips without school affiliation
- Schools can invite teachers to join their organization
- Districts can oversee multiple schools
- Multi-role users can switch between organizational contexts
- Data isolation enforced at database level with Row-Level Security

## Monorepo Structure

```
tripslip-monorepo/
├── apps/                    # Five separate web applications
│   ├── landing/            # Public marketing site
│   ├── venue/              # Venue management app
│   ├── school/             # School/district admin app
│   ├── teacher/            # Teacher trip management app
│   └── parent/             # Parent permission slip app
├── packages/               # Shared packages
│   ├── ui/                 # Shared Radix UI components
│   ├── database/           # Supabase client and types
│   ├── auth/               # Authentication utilities
│   ├── i18n/               # Internationalization (EN/ES/AR)
│   └── utils/              # Shared utility functions
├── supabase/               # Backend configuration
│   ├── migrations/         # Database migrations
│   ├── functions/          # Edge functions
│   └── storage/            # Storage bucket configs
├── turbo.json              # Turborepo configuration
└── package.json            # Root workspace configuration
```

## Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router 7
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Internationalization**: i18next with react-i18next (EN/ES/AR)

### Backend
- **Database**: Supabase (PostgreSQL with Row-Level Security)
- **Authentication**: Supabase Auth with role-based access control
- **Storage**: Supabase Storage for documents and media
- **Edge Functions**: Supabase Functions for serverless logic
- **Payments**: Stripe with split payments and refunds

### Development
- **Monorepo**: Turborepo for coordinated builds and caching
- **Package Manager**: npm workspaces
- **Testing**: Vitest with fast-check for property-based testing
- **Type Safety**: TypeScript with strict mode

### Deployment
- **Frontend**: Cloudflare Pages / Netlify
- **Backend**: Supabase (managed PostgreSQL, Auth, Storage)
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase and Stripe keys
```

### Development

```bash
# Run all apps in development mode
npm run dev

# Run specific app
npm run dev --filter=@tripslip/landing
npm run dev --filter=@tripslip/venue
npm run dev --filter=@tripslip/teacher
```

### Build

```bash
# Build all apps
npm run build

# Build specific app
npm run build --filter=@tripslip/landing
```

### Lint

```bash
# Lint all packages
npm run lint

# Lint specific package
npm run lint --filter=@tripslip/ui
```

### Test

```bash
# Run all tests
npm run test

# Run unit tests only
npm run test:unit

# Run property-based tests
npm run test:property

# Run integration tests
npm run test:integration

# Run tests for specific package
npm run test --filter=@tripslip/database

# Generate coverage report
npm run test:coverage

# Check coverage threshold (70%)
npm run check:coverage
```

The project maintains a minimum 70% test coverage threshold enforced in CI/CD. See [Test Coverage Plan](docs/test-coverage-plan.md) for details on coverage status and improvement plans.

### Type Check

```bash
# Type check all packages
npm run type-check

# Type check specific package
npm run type-check --filter=@tripslip/auth
```

### Verification Scripts

```bash
# Verify Stripe configuration
npm run verify:stripe

# Verify database connection and schema
npm run verify:database

# Create test users for development
npm run create-test-users
```

## Environment Variables

See `.env.example` for required environment variables:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- Application URLs for each of the five apps

## Deployment

Each application is deployed independently:

- **Landing**: `tripslip.com`
- **Venue**: `venue.tripslip.com`
- **School**: `school.tripslip.com`
- **Teacher**: `teacher.tripslip.com`
- **Parent**: `parent.tripslip.com`

All apps share a single Supabase backend for data consistency.

## Key Features

### Organizational Management
- **Flexible Hierarchy** - Support for independent teachers, schools, and multi-school districts
- **District Administration** - District-wide oversight, school management, and aggregated reporting
- **School Administration** - Teacher management, trip approvals, and school-level policies
- **Teacher Independence** - Teachers can operate without school affiliation or join later
- **Multi-Role Support** - Users can have multiple roles across different organizations
- **Role Switching** - Seamless context switching between organizational roles

### Core Functionality
- **Multi-Application Architecture** - Five independent apps sharing common packages and backend
- **Venue Discovery** - Text and geographic search with filtering by categories, capacity, and amenities
- **Experience Management** - Venues create and manage field trip experiences with pricing and availability
- **Trip Planning** - Teachers search venues, create trips, and manage student rosters
- **Booking System** - Real-time availability checking, capacity management, and booking confirmations
- **Approval Workflows** - Configurable multi-level approval chains based on trip cost and characteristics
- **Permission Slips** - Digital permission slips with parent signatures and medical information
- **Payment Processing** - Stripe integration with split payments, deposits, refunds, and donation system

### Security & Compliance
- **Flexible Authentication** - Required for venues/schools, optional for teachers/parents
- **Role-Based Access Control (RBAC)** - Fine-grained permissions with role switching
- **Row-Level Security (RLS)** - Database-level access control enforcing multi-tenancy
- **FERPA Compliance** - Audit trails, data privacy controls, and consent management
- **Medical Form Encryption** - AES-256 encryption for sensitive student health information
- **Data Isolation** - Organizational boundaries enforced at database level

### User Experience
- **Multi-Language Support** - English, Spanish, and Arabic with full RTL support
- **Document Management** - PDF generation, secure storage, and document versioning
- **Notifications** - Email, SMS, and in-app notifications for all stakeholders
- **Real-time Updates** - Live booking status and approval updates via Supabase Realtime
- **Responsive Design** - Mobile-first design with WCAG 2.1 AA accessibility compliance
- **Magic Links** - Passwordless authentication for parents via email

### Developer Experience
- **Type Safety** - Full TypeScript coverage with generated database types
- **Comprehensive Testing** - 376 tests with property-based testing (100% pass rate)
- **Service Layers** - Clean separation of business logic from UI
- **Shared Packages** - Reusable components, utilities, and services
- **Hot Module Replacement** - Fast development with Vite HMR
- **Monorepo Benefits** - Coordinated builds, shared dependencies, and caching with Turborepo

## Package Structure

### Applications (`apps/`)
- **landing** - Marketing site with pricing, features, and contact forms
- **venue** - Venue profile management, experience creation, booking management
- **school** - District/school admin, teacher management, trip approval workflows
- **teacher** - Venue search, trip planning, roster management, permission tracking
- **parent** - Permission slips, payments, trip information, student profiles

### Shared Packages (`packages/`)
- **ui** - Radix UI component library with Tailwind CSS styling
- **database** - Supabase client, TypeScript types, and service layers (376 tests, 100% passing)
  - 40+ database tables with comprehensive service layers
  - Venue management, booking system, approval workflows
  - Payment processing, consent management, audit logging
- **auth** - Authentication utilities, RBAC, session management
  - Role-based access control with 7 user roles
  - Multi-role support with context switching
  - Row-level security policy helpers
- **i18n** - Translation files for EN/ES/AR with RTL support
- **utils** - Date/time utilities, error handling, accessibility helpers

## Database Schema

The platform uses a comprehensive PostgreSQL schema with 40+ tables organized into functional domains:

### User Management & RBAC
- `districts` - School district information and settings
- `schools` - School profiles linked to districts
- `teachers` - Teacher accounts and permissions
- `parents` - Parent contact information
- `students` - Student profiles and rosters
- `user_roles` - Role definitions (teacher, school_admin, district_admin, tripslip_admin, venue_admin, venue_editor, venue_viewer)
- `user_role_assignments` - User-to-role mappings with organizational context
- `active_role_context` - Current active role for multi-role users

### Venue System
- `venues` - Venue profiles with location, contact, and description
- `venue_users` - Venue employee accounts with access levels
- `experiences` - Field trip offerings with pricing and availability
- `venue_forms` - Legal documents and permission forms
- `venue_media` - Photos and videos for venues
- `venue_categories` - Category taxonomy for classification
- `venue_category_assignments` - Venue-to-category mappings
- `venue_reviews` - Teacher reviews and ratings
- `venue_claim_requests` - Venue profile claim workflow
- `venue_bookings` - Trip bookings with venues
- `booking_messages` - Teacher-venue communication threads

### Trip Management
- `trips` - Planned field trips with dates and details
- `permission_slips` - Digital permission forms with signatures
- `documents` - Uploaded documents (medical forms, etc.)
- `chaperones` - Adult supervision assignments
- `attendance` - Student attendance tracking
- `availability` - Venue availability calendar

### Payment System
- `payments` - Payment transactions via Stripe
- `refunds` - Refund processing and tracking
- `pricing_tiers` - Volume-based pricing for experiences

### Approval Workflows
- `approval_chains` - Configurable approval sequences by cost/type
- `approval_chain_steps` - Individual approval steps with roles
- `trip_approvals` - Trip approval records and status
- `approval_conversations` - Discussion threads for approvals
- `approval_delegations` - Temporary approval authority delegation

### Data Sharing & Consent
- `data_sharing_consents` - Parent consent for information sharing with venues

### System Management
- `notifications` - In-app, email, and SMS notifications
- `audit_logs` - Comprehensive audit trail for compliance
- `rate_limits` - API rate limiting configuration

### Row-Level Security (RLS)

All tables implement PostgreSQL Row-Level Security policies enforcing:
- **Multi-tenant data isolation** - Users only see data from their organization
- **Role-based access control** - Permissions based on user roles
- **Organizational hierarchy** - District admins see all schools, school admins see their school
- **Parent-student privacy** - Parents only access their children's data
- **Venue data access** - Venue employees only see their venue's data

## Testing

The project includes comprehensive testing with 376 tests across the database package:

- **Unit Tests** (270 tests) - Service layer testing with mocked dependencies
- **Property-Based Tests** (106 tests) - Correctness properties validated with fast-check
- **Integration Tests** - End-to-end workflow testing

**Test Coverage:**
- Access control and permissions (RBAC, RLS policies)
- Venue management (profiles, media, claiming, categorization)
- Experience operations (CRUD, availability, pricing)
- Booking system (creation, capacity, workflows, status transitions)
- Review system (ratings, moderation, flagging)
- Search functionality (text, geographic, filtering, sorting)
- Approval workflows (routing, cost thresholds, status transitions)
- Consent enforcement (data sharing, privacy controls)
- Data integrity (foreign keys, constraints, validation)

All tests pass with a 100% success rate. See [DATABASE_TEST_STATUS.md](DATABASE_TEST_STATUS.md) for details.

## Documentation

### Getting Started
- [Environment Setup](#installation) - Installation and configuration
- [Development Workflow](#development) - Running apps locally
- [Testing Guide](#test) - Running and writing tests

### Platform Architecture
- [Platform Requirements](.kiro/specs/tripslip-platform-architecture/requirements.md)
- [Technical Design](.kiro/specs/tripslip-platform-architecture/design.md)
- [Implementation Tasks](.kiro/specs/tripslip-platform-architecture/tasks.md)
- [Production Launch Plan](.kiro/specs/tripslip-production-launch/requirements.md)

### Authentication & Security
- [Authentication Guide](docs/AUTHENTICATION_GUIDE.md) - Signup, login, and role management
- [RLS Security Model](docs/RLS_SECURITY_MODEL.md) - Row-level security policies
- [Rollback Procedure](docs/ROLLBACK_PROCEDURE.md) - Emergency rollback instructions
- [Test User Setup](docs/TEST_USER_SETUP.md) - Creating test users for development

### Database
- [Database Package README](packages/database/README.md) - Service layers and types
- [Database Setup](docs/DATABASE_README.md) - Initial setup and configuration
- [Database Setup Checklist](docs/DATABASE_SETUP_CHECKLIST.md) - Step-by-step setup
- [Production Database Setup](docs/PRODUCTION_DATABASE_SETUP.md) - Production deployment
- [Database Test Status](DATABASE_TEST_STATUS.md) - Test suite results

### Payments
- [Stripe Setup Guide](docs/STRIPE_SETUP_GUIDE.md) - Stripe integration setup
- [Stripe Setup Checklist](docs/STRIPE_SETUP_CHECKLIST.md) - Configuration checklist

### Feature Specifications
- [Venue Experience System](.kiro/specs/venue-experience-database-system/requirements.md)
- [Authentication & Access Control](.kiro/specs/authentication-and-access-control-fixes/requirements.md)
- [Enhanced Payment System](.kiro/specs/enhanced-payment-and-addons-system/requirements.md)
- [Database Test Fixes](.kiro/specs/database-test-fixes/requirements.md)

## Deployment

### Frontend Applications

Each application can be deployed independently to Cloudflare Pages or Netlify:

```bash
# Deploy all apps
./scripts/deploy-all-apps.sh

# Deploy to Cloudflare Pages
./scripts/deploy-cloudflare.sh

# Deploy to Netlify
./scripts/deploy-netlify.sh

# Verify deployments
node scripts/verify-deployments.js
```

### Backend (Supabase)

The backend is managed through Supabase:

```bash
# Apply database migrations
supabase db push --linked

# Verify migration status
supabase migration list --linked

# Generate TypeScript types
supabase gen types typescript --linked > packages/database/src/types.ts
```

### Environment Variables

Set environment variables for each deployment:

```bash
# Set Cloudflare environment variables
./scripts/set-cloudflare-env.sh

# Set GitHub secrets for CI/CD
./scripts/setup-github-secrets.sh
```

## Project Status

### Infrastructure (95% Complete) ✅
- Monorepo setup with Turborepo
- Database schema with 40+ tables and 44 migrations
- Row-level security policies for all tables
- Shared packages (ui, database, auth, i18n, utils)
- 5 Edge Functions for serverless logic
- Comprehensive test suite (376 tests, 100% passing)

### Completed Features ✅
- **Authentication & Authorization** - RBAC with 7 roles, role switching, multi-tenancy
- **Organizational Hierarchy** - Districts, schools, teachers with flexible relationships
- **Venue System** - Profiles, media, claiming, categorization, employee management
- **Experience Management** - Creation, pricing tiers, availability calendars
- **Venue Discovery** - Text search, geographic filtering, category browsing
- **Booking System** - Capacity management, status workflows, confirmation numbers
- **Review System** - Ratings, written reviews, venue responses, moderation
- **Approval Workflows** - Configurable chains, cost thresholds, delegation
- **Payment Processing** - Stripe integration, split payments, refunds, donations
- **Consent Management** - Parent consent for data sharing with venues
- **Multi-Language Support** - EN/ES/AR with RTL support
- **Audit Logging** - Comprehensive audit trail for compliance

### In Progress (20-40% Complete) 🚧
- **Landing App** (40%) - Marketing pages, pricing, contact forms
- **Teacher App** (35%) - Trip creation wizard, venue search UI, roster management
- **Venue App** (30%) - Profile editor, experience manager, booking dashboard
- **Parent App** (25%) - Permission slip viewing, payment processing, signature capture
- **School App** (20%) - District/school dashboards, teacher management, approval UI

### Planned Features 📋
- Email and SMS notification delivery
- PDF generation for permission slips and reports
- Real-time updates via Supabase Realtime
- Mobile applications (iOS/Android)
- Advanced analytics and reporting dashboards
- Integration with school information systems (SIS)
- Automated trip reminders and follow-ups
- Post-trip feedback collection and surveys
- Chaperone background check tracking
- Transportation and bus scheduling

## Contributing

This is a private project. For internal development:

1. Create a feature branch from `main`
2. Make your changes with tests
3. Run `npm run lint` and `npm run test`
4. Submit a pull request for review

## Support

For questions or issues:
- Check the [documentation](#documentation)
- Review [existing specs](.kiro/specs/)
- Contact the development team

## License

Private - All rights reserved
