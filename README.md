# TripSlip Platform

Digital field trip management platform connecting venues, schools, teachers, and parents. Built with a modern monorepo architecture using Turborepo.

## Overview

TripSlip is a multi-application platform that streamlines the field trip experience:

- **Landing App** - Public marketing website (tripslip.com)
- **Venue App** - Venue management and experience creation (venue.tripslip.com)
- **School App** - School/district administration (school.tripslip.com)
- **Teacher App** - Trip planning and roster management (teacher.tripslip.com)
- **Parent App** - Permission slips and payments (parent.tripslip.com)

All applications share a unified Supabase backend with flexible authentication patterns and support for English, Spanish, and Arabic.

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

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo |
| Framework | React 19 + TypeScript |
| Build Tool | Vite 7 |
| Routing | React Router 7 |
| UI Components | Radix UI |
| Styling | Tailwind CSS 4 |
| State Management | Zustand |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| Payments | Stripe |
| i18n | i18next with react-i18next |
| Deployment | Vercel/Netlify (frontend), Supabase (backend) |

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

# Run tests for specific package
npm run test --filter=@tripslip/database
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

- **Multi-Application Architecture** - Five independent apps sharing common packages
- **Flexible Authentication** - Required auth for venues, optional for teachers/parents
- **Payment Processing** - Stripe integration with split payments and refunds
- **Multi-Language Support** - English, Spanish, and Arabic with RTL support
- **Document Management** - PDF generation, secure storage, medical form encryption
- **Compliance** - FERPA compliance, audit trails, data privacy controls
- **Notifications** - Email, SMS, and in-app notifications

## Documentation

- [Requirements](.kiro/specs/tripslip-platform-architecture/requirements.md)
- [Technical Design](.kiro/specs/tripslip-platform-architecture/design.md)
- [Implementation Tasks](.kiro/specs/tripslip-platform-architecture/tasks.md)

## License

Private - All rights reserved
