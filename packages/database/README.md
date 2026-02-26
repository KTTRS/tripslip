# @tripslip/database

Shared database client and TypeScript types for TripSlip platform applications.

## Overview

This package provides:
- Type-safe Supabase client creation
- Generated TypeScript types from Supabase schema
- Shared database utilities

## Usage

### Creating a Supabase Client

```tsx
import { createSupabaseClient } from '@tripslip/database';

const supabase = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Type-safe queries
const { data, error } = await supabase
  .from('experiences')
  .select('*')
  .eq('id', experienceId);
```

### Using Types

```tsx
import type { Database } from '@tripslip/database';

type Experience = Database['public']['Tables']['experiences']['Row'];
type ExperienceInsert = Database['public']['Tables']['experiences']['Insert'];
type ExperienceUpdate = Database['public']['Tables']['experiences']['Update'];
```

### Authentication

```tsx
import { createSupabaseClient } from '@tripslip/database';
import type { User, Session } from '@tripslip/database';

const supabase = createSupabaseClient(url, key);

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// Get session
const { data: { session } } = await supabase.auth.getSession();

// Sign out
await supabase.auth.signOut();
```

## Generating Types

To regenerate types from your Supabase schema:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Generate types
supabase gen types typescript --project-id yvzpgbhinxibebgeevcu > packages/database/src/types.ts
```

## Environment Variables

Required environment variables:

```env
VITE_SUPABASE_URL=https://yvzpgbhinxibebgeevcu.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Features

- **Type Safety**: Full TypeScript support for all database operations
- **Auto-completion**: IDE auto-completion for table names, columns, and relationships
- **Row-Level Security**: Automatic enforcement of RLS policies
- **Real-time**: Built-in support for Supabase Realtime subscriptions
- **Auth Integration**: Seamless integration with Supabase Auth
