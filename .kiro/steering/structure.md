# Project Structure

## Monorepo Organization

```
tripslip-monorepo/
├── apps/                    # Five separate web applications
│   ├── landing/            # Public marketing site
│   ├── venue/              # Venue management app
│   ├── school/             # School/district admin app
│   ├── teacher/            # Trip planning and roster management
│   └── parent/             # Permission slips and payments
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
├── .kiro/                  # Kiro configuration
│   ├── specs/              # Feature specifications
│   ├── steering/           # AI assistant guidance
│   └── hooks/              # Automation hooks
└── docs/                   # Documentation
```

## Application Structure

Each app in `apps/` follows a consistent structure:
- `src/pages/` - Route components
- `src/components/` - Reusable UI components
- `src/stores/` - Zustand state management
- `src/hooks/` - Custom React hooks
- `src/utils/` - App-specific utilities
- `src/types/` - TypeScript type definitions

## Shared Package Structure

### `packages/ui/`
- Radix UI component library
- Tailwind CSS styling
- Consistent design system across all apps

### `packages/database/`
- Supabase client configuration
- Database service layers
- TypeScript types for database entities
- Property-based tests for data integrity

### `packages/auth/`
- Authentication utilities
- Role-based access control (RBAC)
- Session management
- Multi-app authentication patterns

### `packages/i18n/`
- Translation files for EN/ES/AR
- RTL support for Arabic
- Internationalization utilities

### `packages/utils/`
- Date/time utilities
- Error handling
- Accessibility helpers
- Common validation functions

## Database Structure

### `supabase/migrations/`
- Sequential numbered migrations (e.g., `20240101000000_create_core_entities.sql`)
- Each migration includes validation files
- RLS (Row Level Security) policies
- Audit logging and compliance features

### Key Database Entities
- Users, profiles, and authentication
- Schools, districts, and teachers
- Venues and experiences
- Trips, bookings, and payments
- Permission slips and approvals
- Reviews and ratings

## Configuration Files

- `turbo.json` - Turborepo task configuration
- `package.json` - Root workspace configuration
- `.env.example` - Environment variable template
- Individual `package.json` files in each app/package

## Documentation Conventions

- Spec files in `.kiro/specs/{feature-name}/`
- Technical documentation in `docs/`
- README files at package level
- Migration validation files alongside SQL migrations