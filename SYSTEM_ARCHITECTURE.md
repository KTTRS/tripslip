# TripSlip Platform - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Landing  │ │  Venue   │ │  School  │ │ Teacher  │      │
│  │   App    │ │   App    │ │   App    │ │   App    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐                                               │
│  │  Parent  │     React 19 + TypeScript + Vite             │
│  │   App    │     Deployed on Vercel                       │
│  └──────────┘                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Shared Packages Layer                       │
│  @tripslip/ui  @tripslip/database  @tripslip/auth          │
│  @tripslip/i18n  @tripslip/utils                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend Layer (Supabase)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL (21 tables, RLS, indexes)               │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Edge Functions (5 functions)                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Storage (documents, medical-forms)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Auth (magic links, email/password)                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Third-Party Services                         │
│  Stripe (payments)  Email Service  SMS Service              │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo |
| Frontend | React 19, TypeScript, Vite 7 |
| Routing | React Router 7 |
| UI | Radix UI + Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL + Edge Functions) |
| Auth | Supabase Auth |
| Payments | Stripe |
| i18n | i18next (EN/ES/AR) |
| Deployment | Vercel (frontend), Supabase (backend) |

## Database Schema (21 Tables)

**Core Entities**: venues, schools, teachers, students, guardians  
**Trips**: experiences, trips, permission_slips  
**Payments**: payments, refunds  
**Supporting**: documents, notifications, audit_logs, rate_limits

## Edge Functions (5 Functions)

1. `create-payment-intent` - Initialize Stripe payment
2. `stripe-webhook` - Handle payment events
3. `process-refund` - Process refund requests
4. `send-notification` - Send email/SMS
5. `generate-pdf` - Generate permission slip PDFs

## Deployment Architecture

- **Landing**: tripslip.com
- **Venue**: venue.tripslip.com
- **School**: school.tripslip.com
- **Teacher**: teacher.tripslip.com
- **Parent**: parent.tripslip.com

All apps share single Supabase backend.
