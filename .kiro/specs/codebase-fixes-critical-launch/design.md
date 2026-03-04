# Design: Codebase Fixes - Critical Launch Issues

## Architecture Overview

This design addresses all 47 issues identified in the codebase review through systematic fixes organized by priority and impact. The approach focuses on minimal disruption while ensuring production readiness.

## Design Principles

1. **Fail Fast:** Validate environment and configuration at startup
2. **Graceful Degradation:** Handle failures without breaking user experience
3. **Consistent Patterns:** Use same approach for similar problems
4. **Type Safety:** Leverage TypeScript for compile-time error detection
5. **Testability:** All fixes must be testable
6. **Security First:** Validate and sanitize all inputs

---

## Phase 1: Critical Fixes

### 1.1 Fix SchoolTripList Type Errors

**Problem:** Component imports non-existent `supabase` export and uses wrong property names.

**Solution:**
```typescript
// apps/school/src/lib/supabase.ts (NEW FILE)
import { createSupabaseClient } from '@tripslip/database';

export const supabase = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// apps/school/src/components/SchoolTripList.tsx (UPDATED)
import { supabase } from '../lib/supabase';
import type { Database } from '@tripslip/database';

type Trip = Database['public']['Tables']['trips']['Row'] & {
  teacher: { name: string; email: string };
  venue: { name: string };
  experience: { title: string }; // Changed from 'name'
};

// Update property access:
trip.title // instead of trip.name
trip.estimated_cost_cents // instead of trip.total_cost
```

**Files to Modify:**
- Create: `apps/school/src/lib/supabase.ts`
- Update: `apps/school/src/components/SchoolTripList.tsx`

---

### 1.2 Implement PermissionSlipPage

**Architecture:**
```
PermissionSlipPage
├── usePermissionSlipToken (hook)
├── PermissionSlipForm (component)
│   ├── TripDetails (display)
│   ├── StudentInfo (display)
│   ├── ParentInfoForm (input)
│   ├── SignatureCapture (canvas)
│   └── SubmitButton
└── PaymentSection (conditional)
```

**Implementation:**

```typescript
// apps/parent/src/hooks/usePermissionSlipToken.ts (NEW)
export function usePermissionSlipToken() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [slip, setSlip] = useState<PermissionSlip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing token');
      setLoading(false);
      return;
    }

    fetchPermissionSlip(token);
  }, [token]);

  return { slip, loading, error, token };
}

// apps/parent/src/pages/PermissionSlipPage.tsx (COMPLETE REWRITE)
export function PermissionSlipPage() {
  const { slip, loading, error, token } = usePermissionSlipToken();
  const [isSigning, setIsSigning] = useState(false);
  const { t } = useTranslation();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error} />;
  if (!slip) return <NotFoundDisplay />;

  const handleSubmit = async (data: SignatureData) => {
    setIsSigning(true);
    try {
      await submitPermissionSlip(slip.id, data);
      // Redirect to payment if required
      if (slip.requires_payment) {
        navigate(`/payment?slip_id=${slip.id}`);
      } else {
        navigate('/success');
      }
    } catch (err) {
      showError(err);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <TripDetails trip={slip.trip} />
      <StudentInfo student={slip.student} />
      <PermissionSlipForm
        slip={slip}
        onSubmit={handleSubmit}
        isSubmitting={isSigning}
      />
    </div>
  );
}
```

**Components to Create:**
- `apps/parent/src/hooks/usePermissionSlipToken.ts`
- `apps/parent/src/components/permission-slip/TripDetails.tsx`
- `apps/parent/src/components/permission-slip/StudentInfo.tsx`
- `apps/parent/src/components/permission-slip/PermissionSlipForm.tsx`
- `apps/parent/src/components/permission-slip/SignatureCapture.tsx`

---

### 1.3 Environment Variable Validation

**Architecture:**
```typescript
// packages/utils/src/env-validation.ts (NEW)
export interface EnvConfig {
  required: string[];
  optional?: string[];
}

export function validateEnv(config: EnvConfig): void {
  const missing = config.required.filter(
    key => !import.meta.env[key] || import.meta.env[key] === ''
  );

  if (missing.length > 0) {
    const error = new Error(
      `Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\n` +
      `Please check your .env file and ensure all required variables are set.`
    );
    console.error(error.message);
    throw error;
  }

  // Warn about optional missing vars
  const missingOptional = (config.optional || []).filter(
    key => !import.meta.env[key]
  );
  
  if (missingOptional.length > 0) {
    console.warn(
      `Optional environment variables not set:\n${missingOptional.map(k => `  - ${k}`).join('\n')}`
    );
  }
}

// App-specific configs
export const TEACHER_APP_ENV: EnvConfig = {
  required: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'VITE_TEACHER_APP_URL'
  ],
  optional: ['VITE_GOOGLE_MAPS_API_KEY', 'VITE_SENTRY_DSN']
};

export const PARENT_APP_ENV: EnvConfig = {
  required: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'VITE_PARENT_APP_URL'
  ],
  optional: ['VITE_SENTRY_DSN']
};

// Similar for other apps...
```

**Usage in each app:**
```typescript
// apps/teacher/src/main.tsx
import { validateEnv, TEACHER_APP_ENV } from '@tripslip/utils/env-validation';

// Validate before rendering
validateEnv(TEACHER_APP_ENV);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

### 1.4 Remove Console.log Statements

**Strategy:**
1. Create logging utility that uses Sentry in production
2. Replace all console.log with utility
3. Add ESLint rule to prevent future console.log

**Implementation:**
```typescript
// packages/utils/src/logger.ts (NEW)
import { captureMessage, addBreadcrumb } from './monitoring';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private isDevelopment = import.meta.env.DEV;

  debug(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      console.debug(message, context);
    }
    addBreadcrumb({
      message,
      level: 'debug',
      data: context
    });
  }

  info(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      console.info(message, context);
    }
    captureMessage(message, 'info');
  }

  warn(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      console.warn(message, context);
    }
    captureMessage(message, 'warning');
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    if (this.isDevelopment) {
      console.error(message, error, context);
    }
    if (error) {
      captureError(error, context);
    } else {
      captureMessage(message, 'error');
    }
  }
}

export const logger = new Logger();
```

**ESLint Rule:**
```json
// .eslintrc.json
{
  "rules": {
    "no-console": ["error", { "allow": ["warn", "error"] }]
  }
}
```

**Migration Script:**
```bash
# Find and replace console.log
find apps packages -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/__tests__/*" \
  -exec sed -i '' 's/console\.log(/logger.debug(/g' {} \;
```

---

### 1.5 Fix Edge Function Imports

**Problem:** Deno import path for _shared/security.ts may not work.

**Solution:**
```typescript
// supabase/functions/create-payment-intent/index.ts
// Test both import styles:

// Option 1: Relative import (current)
import { validateUUID, validateAmount } from '../_shared/security.ts'

// Option 2: Absolute import from Supabase
import { validateUUID, validateAmount } from 'https://raw.githubusercontent.com/[org]/[repo]/main/supabase/functions/_shared/security.ts'

// Option 3: Copy shared code into each function
// (Not recommended but works as fallback)
```

**Testing:**
```bash
# Test locally with Supabase CLI
supabase functions serve create-payment-intent --env-file .env.local

# Test import resolution
curl -X POST http://localhost:54321/functions/v1/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"permissionSlipId":"test","amountCents":1000}'
```

---

### 1.6 Implement Comprehensive Error Handling

**Pattern:**
```typescript
// Standard async operation wrapper
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(`Error in ${context}`, error);
    return { data: null, error };
  }
}

// Usage
const { data, error } = await withErrorHandling(
  () => createTrip(tripData),
  'trip creation'
);

if (error) {
  showErrorToast(t('errors.tripCreationFailed'));
  return;
}

// Continue with data...
```

**Apply to all async operations:**
- Form submissions
- API calls
- Database queries
- File uploads
- External service calls

---

### 1.7 Fix Stripe Webhook Event Handling

**Implementation:**
```typescript
// supabase/functions/stripe-webhook/index.ts

// Add webhook_events table logging
async function logWebhookEvent(
  event: Stripe.Event,
  status: 'handled' | 'unhandled' | 'error',
  error?: string
) {
  await supabase.from('webhook_events').insert({
    event_id: event.id,
    event_type: event.type,
    status,
    error_message: error,
    payload: event.data.object,
    created_at: new Date(event.created * 1000).toISOString()
  });
}

// Update switch statement
switch (event.type) {
  case 'payment_intent.succeeded':
    await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent, supabase);
    await logWebhookEvent(event, 'handled');
    break;
  
  case 'payment_intent.payment_failed':
    await handlePaymentFailure(event.data.object as Stripe.PaymentIntent, supabase);
    await logWebhookEvent(event, 'handled');
    break;
  
  case 'refund.created':
    await handleRefundCreated(event.data.object as Stripe.Refund, supabase);
    await logWebhookEvent(event, 'handled');
    break;
  
  default:
    console.log(`Unhandled event type: ${event.type}`);
    await logWebhookEvent(event, 'unhandled');
    
    // Alert if critical event type
    if (isCriticalEventType(event.type)) {
      await alertUnhandledEvent(event);
    }
}
```

---

## Phase 2: High Priority Fixes

### 2.1 School App Authentication Context

**Architecture:**
```typescript
// apps/school/src/contexts/SchoolAuthContext.tsx (NEW)
interface SchoolAuthContextType {
  user: User | null;
  schoolId: string | null;
  administratorId: string | null;
  administratorName: string | null;
  role: 'admin' | 'staff' | null;
  loading: boolean;
}

export function SchoolAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SchoolAuthContextType>({
    user: null,
    schoolId: null,
    administratorId: null,
    administratorName: null,
    role: null,
    loading: true
  });

  useEffect(() => {
    // Fetch user and school association
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Fetch school admin profile
        supabase
          .from('school_administrators')
          .select('*, schools(*)')
          .eq('user_id', user.id)
          .single()
          .then(({ data: admin }) => {
            setState({
              user,
              schoolId: admin?.school_id || null,
              administratorId: admin?.id || null,
              administratorName: admin?.name || user.email || null,
              role: admin?.role || null,
              loading: false
            });
          });
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });
  }, []);

  return (
    <SchoolAuthContext.Provider value={state}>
      {children}
    </SchoolAuthContext.Provider>
  );
}

export function useSchoolAuth() {
  const context = useContext(SchoolAuthContext);
  if (!context) {
    throw new Error('useSchoolAuth must be used within SchoolAuthProvider');
  }
  return context;
}
```

**Usage:**
```typescript
// apps/school/src/pages/ApprovalsPage.tsx
const { schoolId, administratorId, administratorName } = useSchoolAuth();

if (!schoolId) {
  return <ErrorDisplay message="No school associated with your account" />;
}

// Use real values instead of hardcoded defaults
```

---

### 2.2 PDF Receipt Generation

**Architecture:**
```typescript
// packages/utils/src/pdf-generator.ts (NEW)
import jsPDF from 'jspdf';

export interface ReceiptData {
  paymentId: string;
  parentName: string;
  studentName: string;
  tripTitle: string;
  venueName: string;
  tripDate: string;
  amountCents: number;
  paymentDate: string;
  paymentMethod: string;
}

export function generateReceipt(data: ReceiptData, language: 'en' | 'es' | 'ar'): jsPDF {
  const doc = new jsPDF();
  
  // Add TripSlip branding
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('TripSlip', 20, 20);
  
  // Add receipt title
  doc.setFontSize(18);
  doc.text(t('receipt.title', 'Payment Receipt'), 20, 40);
  
  // Add payment details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const details = [
    [`Receipt #:`, data.paymentId],
    [`Date:`, data.paymentDate],
    [`Parent:`, data.parentName],
    [`Student:`, data.studentName],
    [`Trip:`, data.tripTitle],
    [`Venue:`, data.venueName],
    [`Trip Date:`, data.tripDate],
    [`Amount:`, `$${(data.amountCents / 100).toFixed(2)}`],
    [`Payment Method:`, data.paymentMethod]
  ];
  
  let y = 60;
  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 80, y);
    y += 10;
  });
  
  // Add footer
  doc.setFontSize(10);
  doc.text('Thank you for using TripSlip!', 20, 280);
  
  return doc;
}

export async function saveReceiptToStorage(
  pdf: jsPDF,
  paymentId: string
): Promise<string> {
  const pdfBlob = pdf.output('blob');
  const fileName = `receipts/${paymentId}.pdf`;
  
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(fileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true
    });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(fileName);
  
  return publicUrl;
}
```

**Usage:**
```typescript
// apps/parent/src/pages/PaymentSuccessPage.tsx
const handleDownloadReceipt = async () => {
  try {
    setDownloading(true);
    const pdf = generateReceipt(receiptData, i18n.language);
    pdf.save(`receipt-${payment.id}.pdf`);
  } catch (error) {
    showError(t('errors.receiptDownloadFailed'));
  } finally {
    setDownloading(false);
  }
};
```

---

### 2.3 Draft Saving Implementation

**Database Migration:**
```sql
-- supabase/migrations/20240304000001_create_trip_drafts.sql
CREATE TABLE trip_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL,
  last_saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(teacher_id) -- One draft per teacher
);

CREATE INDEX idx_trip_drafts_teacher ON trip_drafts(teacher_id);
CREATE INDEX idx_trip_drafts_last_saved ON trip_drafts(last_saved_at);
```

**Implementation:**
```typescript
// apps/teacher/src/stores/tripCreationStore.ts
saveDraft: async () => {
  const state = get();
  const teacherId = state.teacherId;
  
  if (!teacherId) {
    logger.warn('Cannot save draft: no teacher ID');
    return;
  }
  
  try {
    const { error } = await supabase
      .from('trip_drafts')
      .upsert({
        teacher_id: teacherId,
        draft_data: {
          tripDetails: state.tripDetails,
          selectedVenue: state.selectedVenue,
          selectedExperience: state.selectedExperience,
          selectedStudents: state.selectedStudents,
          currentStep: state.currentStep
        },
        last_saved_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    set({ isDraft: true, lastSaved: new Date() });
    logger.info('Draft saved successfully');
  } catch (error) {
    logger.error('Failed to save draft', error);
  }
},

loadDraft: async (teacherId: string) => {
  try {
    const { data, error } = await supabase
      .from('trip_drafts')
      .select('*')
      .eq('teacher_id', teacherId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No draft found
        return;
      }
      throw error;
    }
    
    const draft = data.draft_data;
    set({
      tripDetails: draft.tripDetails,
      selectedVenue: draft.selectedVenue,
      selectedExperience: draft.selectedExperience,
      selectedStudents: draft.selectedStudents,
      currentStep: draft.currentStep,
      isDraft: true,
      lastSaved: new Date(data.last_saved_at)
    });
    
    logger.info('Draft loaded successfully');
  } catch (error) {
    logger.error('Failed to load draft', error);
  }
},

clearDraft: async (teacherId: string) => {
  try {
    await supabase
      .from('trip_drafts')
      .delete()
      .eq('teacher_id', teacherId);
    
    set({ isDraft: false, lastSaved: null });
  } catch (error) {
    logger.error('Failed to clear draft', error);
  }
}
```

**Auto-save Hook:**
```typescript
// apps/teacher/src/hooks/useAutoSave.ts
export function useAutoSave(interval: number = 30000) {
  const saveDraft = useTripCreationStore(state => state.saveDraft);
  
  useEffect(() => {
    const timer = setInterval(() => {
      saveDraft();
    }, interval);
    
    return () => clearInterval(timer);
  }, [saveDraft, interval]);
}
```

---

### 2.4 Remaining High Priority Fixes

Due to length constraints, the remaining high-priority fixes follow similar patterns:

- **Stripe Connect:** Add onboarding flow, webhook handlers, payout dashboard
- **Google Maps:** Uncomment code, add API key validation, implement fallback
- **Email Notifications:** Batch sending, retry logic, status tracking
- **Employee Invitations:** Email templates, magic links, status tracking
- **Search Facets:** Category system, facet UI, multi-select filters
- **Verification Resend:** Rate limiting, Supabase Auth integration
- **Last Login:** Database column, auth hook, UI display
- **Navigation:** React Router setup, route parameters
- **School Association:** Profile fetching, validation, display
- **Logging Tables:** Migrations, indexes, cleanup jobs

---

## Phase 3: Medium Priority Fixes

### 3.1 Centralize Supabase Client

**Pattern for all apps:**
```typescript
// apps/{app}/src/lib/supabase.ts
import { createSupabaseClient } from '@tripslip/database';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

**Migration:**
1. Create lib/supabase.ts in each app
2. Find/replace all inline client creation
3. Update imports
4. Test all functionality

---

### 3.2 Test Coverage & CI/CD Improvements

**Coverage Script:**
```javascript
// scripts/check-coverage.js
const fs = require('fs');
const path = require('path');

const coveragePath = path.join(__dirname, '../coverage/coverage-summary.json');
const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));

const threshold = 70;
const actual = coverage.total.lines.pct;

console.log(`Coverage: ${actual.toFixed(2)}%`);

if (actual < threshold) {
  console.error(`❌ Coverage ${actual.toFixed(2)}% is below threshold ${threshold}%`);
  process.exit(1);
}

console.log(`✅ Coverage ${actual.toFixed(2)}% meets threshold ${threshold}%`);
process.exit(0);
```

**Smoke Tests:**
```typescript
// tests/smoke/critical-paths.test.ts
describe('Smoke Tests', () => {
  test('Authentication flow works', async () => {
    // Test login, session, logout
  });
  
  test('Trip creation flow works', async () => {
    // Test venue search, experience selection, trip creation
  });
  
  test('Payment flow works', async () => {
    // Test payment intent, Stripe, confirmation
  });
});
```

---

## Phase 4: Low Priority Improvements

### 4.1 TypeScript Strict Mode

**Root tsconfig.json:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Migration Strategy:**
1. Enable one flag at a time
2. Fix errors in each package
3. Test thoroughly
4. Move to next flag

---

### 4.2 Accessibility, Loading States, Pagination

These follow standard React patterns:
- ARIA labels on all interactive elements
- Loading spinners with proper announcements
- Pagination with page size controls
- Empty states with helpful CTAs

---

## Testing Strategy

### Unit Tests
- All new utilities and services
- All modified components
- Edge cases and error paths

### Integration Tests
- Permission slip flow end-to-end
- Payment processing with Stripe
- Email/SMS notification delivery
- Draft saving and loading

### E2E Tests
- Complete user journeys for each persona
- Cross-browser testing
- Mobile responsiveness

### Performance Tests
- Page load times
- API response times
- Database query performance
- Edge Function execution time

---

## Deployment Strategy

### Staging Deployment
1. Deploy all fixes to staging
2. Run full test suite
3. Manual QA testing
4. Performance benchmarking
5. Security audit

### Production Deployment
1. Feature flags for major changes
2. Gradual rollout (10% → 50% → 100%)
3. Monitor error rates
4. Monitor performance metrics
5. Rollback plan ready

---

## Monitoring & Alerts

### Key Metrics
- Error rate by component
- API response times
- Database query performance
- User session duration
- Conversion rates

### Alerts
- Error rate > 1%
- API response time > 1s
- Database query time > 500ms
- Failed payments
- Unhandled webhook events

---

## Success Criteria

1. ✅ All 47 issues resolved
2. ✅ Zero TypeScript compilation errors
3. ✅ Zero console.log in production
4. ✅ Test coverage > 70%
5. ✅ All critical user flows functional
6. ✅ Security audit passed
7. ✅ Performance benchmarks met
8. ✅ Production deployment successful

---

## Rollback Plan

If critical issues arise:
1. Revert to previous deployment
2. Investigate root cause
3. Fix in development
4. Re-test thoroughly
5. Re-deploy with fixes

---

This design provides a comprehensive, systematic approach to fixing all identified issues while maintaining code quality and minimizing risk.
