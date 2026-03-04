# Technology Stack

## Build System & Architecture

- **Monorepo**: Turborepo for coordinated builds and caching
- **Package Manager**: npm (v9+) with workspaces
- **Node.js**: v18+ required

## Frontend Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router 7
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Internationalization**: i18next with react-i18next

## Backend & Services

- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Edge Functions**: Supabase Functions
- **Payments**: Stripe
- **Testing**: Vitest with fast-check for property-based testing

## Common Commands

### Development
```bash
# Run all apps
npm run dev

# Run specific app
npm run dev --filter=@tripslip/landing
npm run dev --filter=@tripslip/venue
npm run dev --filter=@tripslip/teacher
npm run dev --filter=@tripslip/school
npm run dev --filter=@tripslip/parent
```

### Building
```bash
# Build all apps
npm run build

# Build specific app
npm run build --filter=@tripslip/landing
```

### Testing
```bash
# Run all tests
npm run test

# Run unit tests only
npm run test:unit

# Run property-based tests
npm run test:property

# Run integration tests
npm run test:integration
```

### Code Quality
```bash
# Lint all packages
npm run lint

# Type check all packages
npm run type-check

# Clean all build artifacts
npm run clean
```

### Verification Scripts
```bash
# Verify Stripe configuration
npm run verify:stripe

# Verify database connection
npm run verify:database
```

## Environment Variables

Required environment variables (see `.env.example`):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- Application URLs for each of the five apps

## Testing Strategy

- **Unit Tests**: Standard component and service testing
- **Property-Based Tests**: Using fast-check for correctness properties
- **Integration Tests**: End-to-end workflow testing
- Coverage reporting with Vitest coverage