# Application Implementation Roadmap

This document provides a prioritized roadmap for completing the TripSlip application implementations. Currently, most apps have only skeleton UIs with no real functionality.

## 🎯 Current State Assessment

### Landing App ✅ (90% Complete)
- **Status**: Mostly complete
- **Has**: Hero, features, pricing, testimonials, CTA sections
- **Missing**: 
  - Contact form functionality
  - Blog/resources section
  - SEO optimization
  - Analytics integration

### Venue App ⚠️ (40% Complete)
- **Status**: Routing exists, pages incomplete
- **Has**: Auth context, protected routes, page structure
- **Missing**:
  - Dashboard with real data
  - Experience creation/editing forms
  - Trip management interface
  - Financial reporting
  - Settings page

### Teacher App ⚠️ (20% Complete)
- **Status**: Static dashboard only
- **Has**: Basic dashboard layout
- **Missing**:
  - Authentication integration
  - Trip creation workflow
  - Student roster management
  - Permission slip tracking
  - Communication tools

### Parent App ⚠️ (20% Complete)
- **Status**: Static permission slip view
- **Has**: Basic permission slip layout
- **Missing**:
  - Authentication (magic link)
  - Stripe payment integration
  - Split payment support
  - Document viewing
  - Multi-language support

### School App ⚠️ (20% Complete)
- **Status**: Static dashboard only
- **Has**: Basic dashboard layout
- **Missing**:
  - Authentication integration
  - Teacher management
  - Trip oversight
  - Reporting dashboard
  - Settings and configuration

---

## 📋 Implementation Priority Matrix

| App | Priority | Complexity | User Impact | Estimated Time |
|-----|----------|------------|-------------|----------------|
| Parent App | 🔴 Critical | Medium | Very High | 3-4 days |
| Teacher App | 🔴 Critical | High | Very High | 5-7 days |
| Venue App | 🟡 High | High | High | 5-7 days |
| School App | 🟢 Medium | Medium | Medium | 3-4 days |
| Landing App | 🟢 Low | Low | Low | 1-2 days |

**Rationale**: Parent and Teacher apps are critical because they form the core permission slip workflow. Without these, the platform doesn't function.

---

## 🚀 Phase 1: Parent App (Critical Path)

**Goal**: Enable parents to view, sign, and pay for permission slips.

**Estimated Time**: 3-4 days

### 1.1 Authentication Setup (4 hours)

**File**: `apps/parent/src/contexts/AuthContext.tsx`

```typescript
import { createContext, useContext, useEffect, useState } from 'react'
import { createSupabaseClient } from '@tripslip/database'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithMagicLink: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/permission-slip`
      }
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithMagicLink, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

### 1.2 Permission Slip Viewing (6 hours)

**File**: `apps/parent/src/pages/PermissionSlipPage.tsx`

```typescript
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { createSupabaseClient } from '@tripslip/database'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@tripslip/ui'
import { useAuth } from '../contexts/AuthContext'

export default function PermissionSlipPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { user } = useAuth()
  const [slip, setSlip] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createSupabaseClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    if (!token) return

    const fetchSlip = async () => {
      const { data, error } = await supabase
        .from('permission_slips')
        .select(`
          *,
          students (*),
          trips (
            *,
            experiences (*)
          )
        `)
        .eq('token', token)
        .single()

      if (error) {
        console.error('Error fetching slip:', error)
      } else {
        setSlip(data)
      }
      setLoading(false)
    }

    fetchSlip()
  }, [token])

  if (loading) return <div>Loading...</div>
  if (!slip) return <div>Permission slip not found</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b-2 border-black p-4">
        <h1 className="text-2xl font-bold font-display">TripSlip Parent</h1>
      </nav>
      <main className="max-w-3xl mx-auto p-8">
        <h2 className="text-3xl font-bold mb-8">Permission Slip</h2>
        <Card className="border-2 border-black shadow-offset-lg">
          <CardHeader>
            <CardTitle>{slip.trips?.experiences?.title}</CardTitle>
            <p className="text-gray-600">
              {slip.trips?.experiences?.location} - {new Date(slip.trips?.experiences?.event_date).toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Trip Details</h3>
              <p className="text-gray-700">{slip.trips?.experiences?.description}</p>
              <p className="text-gray-700 mt-2">
                Cost: ${(slip.trips?.experiences?.cost_cents / 100).toFixed(2)} per student
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Student Information</h3>
              <p className="text-gray-700">Name: {slip.students?.first_name} {slip.students?.last_name}</p>
              <p className="text-gray-700">Grade: {slip.students?.grade}</p>
            </div>
            {slip.status === 'pending' && (
              <div className="space-y-4">
                <Button className="w-full shadow-offset">Sign Permission Slip</Button>
                <Button variant="outline" className="w-full border-2 border-black">
                  Pay ${(slip.trips?.experiences?.cost_cents / 100).toFixed(2)}
                </Button>
              </div>
            )}
            {slip.status === 'signed' && (
              <div className="bg-green-50 border-2 border-green-500 p-4 rounded">
                <p className="text-green-700 font-semibold">✓ Signed on {new Date(slip.signed_at).toLocaleDateString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
```

### 1.3 Digital Signature (4 hours)

**File**: `apps/parent/src/components/SignatureCanvas.tsx`

```typescript
import { useRef, useState } from 'react'
import { Button } from '@tripslip/ui'

interface SignatureCanvasProps {
  onSave: (signature: string) => void
}

export function SignatureCanvas({ onSave }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const save = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const dataUrl = canvas.toDataURL('image/png')
    onSave(dataUrl)
  }

  return (
    <div className="space-y-4">
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className="border-2 border-black rounded cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <div className="flex gap-2">
        <Button onClick={clear} variant="outline">Clear</Button>
        <Button onClick={save}>Save Signature</Button>
      </div>
    </div>
  )
}
```

### 1.4 Stripe Payment Integration (8 hours)

**File**: `apps/parent/src/components/PaymentForm.tsx`

```typescript
import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@tripslip/ui'
import { createSupabaseClient } from '@tripslip/database'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

function CheckoutForm({ slipId, amount }: { slipId: string; amount: number }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message || 'An error occurred')
      setLoading(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    })

    if (confirmError) {
      setError(confirmError.message || 'Payment failed')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="bg-red-50 border-2 border-red-500 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      <Button type="submit" disabled={!stripe || loading} className="w-full">
        {loading ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
      </Button>
    </form>
  )
}

export function PaymentForm({ slipId, amount }: { slipId: string; amount: number }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const supabase = createSupabaseClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )

  const createPaymentIntent = async () => {
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        permissionSlipId: slipId,
        amountCents: amount,
      },
    })

    if (error) {
      console.error('Error creating payment intent:', error)
      return
    }

    setClientSecret(data.clientSecret)
  }

  if (!clientSecret) {
    return (
      <Button onClick={createPaymentIntent} className="w-full">
        Continue to Payment
      </Button>
    )
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm slipId={slipId} amount={amount} />
    </Elements>
  )
}
```

### 1.5 Multi-Language Support (4 hours)

**File**: `apps/parent/src/App.tsx` (update)

```typescript
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@tripslip/i18n'
import { Routes, Route } from 'react-router'
import { AuthProvider } from './contexts/AuthContext'
import PermissionSlipPage from './pages/PermissionSlipPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <Routes>
          <Route path="/permission-slip" element={<PermissionSlipPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/" element={<PermissionSlipPage />} />
        </Routes>
      </AuthProvider>
    </I18nextProvider>
  )
}
```

---

## 🚀 Phase 2: Teacher App (Critical Path)

**Goal**: Enable teachers to create trips, manage rosters, and track permission slips.

**Estimated Time**: 5-7 days

### 2.1 Authentication Setup (4 hours)
- Similar to Parent App but with email/password
- Add role-based access control
- Session management

### 2.2 Trip Creation Workflow (12 hours)
- Multi-step form for trip creation
- Experience selection from venue catalog
- Date and time selection
- Student roster import/creation
- Permission slip generation

### 2.3 Dashboard with Real Data (8 hours)
- Fetch trips from database
- Display permission slip status
- Show payment status
- Quick actions (send reminders, view reports)

### 2.4 Student Roster Management (8 hours)
- Add/remove students
- Import from CSV
- Link to guardians
- Medical information (encrypted)

### 2.5 Communication Tools (6 hours)
- Send reminders to parents
- Bulk email/SMS
- Track delivery status

---

## 🚀 Phase 3: Venue App (High Priority)

**Goal**: Enable venues to create experiences and manage bookings.

**Estimated Time**: 5-7 days

### 3.1 Complete Dashboard (8 hours)
- Revenue analytics
- Booking calendar
- Experience performance metrics
- Recent activity feed

### 3.2 Experience Management (12 hours)
- Create/edit experience forms
- Photo upload
- Pricing configuration
- Availability calendar
- Indemnification text

### 3.3 Trip Management (8 hours)
- View booked trips
- Manage capacity
- Communication with teachers
- Cancellation handling

### 3.4 Financial Reporting (6 hours)
- Revenue reports
- Payment tracking
- Refund management
- Export to CSV

---

## 🚀 Phase 4: School App (Medium Priority)

**Goal**: Enable school admins to oversee all trips and manage teachers.

**Estimated Time**: 3-4 days

### 4.1 Teacher Management (6 hours)
- Add/remove teachers
- Assign permissions
- View teacher activity

### 4.2 Trip Oversight (8 hours)
- View all school trips
- Approve/reject trips
- Budget tracking
- Compliance monitoring

### 4.3 Reporting Dashboard (6 hours)
- School-wide statistics
- Permission slip completion rates
- Payment tracking
- Export reports

---

## 🚀 Phase 5: Landing App (Low Priority)

**Goal**: Polish marketing site and add missing features.

**Estimated Time**: 1-2 days

### 5.1 Contact Form (3 hours)
- Form validation
- Email integration
- Success/error handling

### 5.2 SEO Optimization (2 hours)
- Meta tags
- Structured data
- Sitemap generation

### 5.3 Analytics Integration (2 hours)
- Google Analytics
- Vercel Analytics
- Event tracking

---

## 📊 Implementation Timeline

```
Week 1: Parent App (Critical)
├── Day 1-2: Authentication + Permission Slip Viewing
├── Day 3: Digital Signature
└── Day 4-5: Stripe Payment Integration

Week 2: Teacher App (Critical)
├── Day 1-2: Authentication + Dashboard
├── Day 3-4: Trip Creation Workflow
└── Day 5: Student Roster Management

Week 3: Venue App (High Priority)
├── Day 1-2: Dashboard + Analytics
├── Day 3-4: Experience Management
└── Day 5: Trip Management

Week 4: School App + Landing App (Medium/Low Priority)
├── Day 1-2: School App - Teacher Management + Oversight
├── Day 3: School App - Reporting
└── Day 4-5: Landing App - Polish + SEO
```

---

## ✅ Definition of Done

Each app is considered "done" when:

- [ ] All core features implemented
- [ ] Authentication working
- [ ] Database integration complete
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Mobile responsive
- [ ] Accessibility tested
- [ ] No console errors
- [ ] TypeScript errors resolved
- [ ] Linting passes
- [ ] Manual testing complete
- [ ] Deployed to staging

---

## 🎯 Success Metrics

### Parent App
- Parents can view permission slips: ✅
- Parents can sign digitally: ✅
- Parents can make payments: ✅
- Multi-language support works: ✅

### Teacher App
- Teachers can create trips: ✅
- Teachers can manage rosters: ✅
- Teachers can track permission slips: ✅
- Teachers can communicate with parents: ✅

### Venue App
- Venues can create experiences: ✅
- Venues can manage bookings: ✅
- Venues can view analytics: ✅
- Venues can process refunds: ✅

### School App
- Admins can manage teachers: ✅
- Admins can oversee trips: ✅
- Admins can view reports: ✅
- Admins can track budgets: ✅

---

## 📞 Need Help?

- Review the [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md) for infrastructure setup
- Review the [QUICK_START_FIXES.md](./QUICK_START_FIXES.md) for critical fixes
- Check the design document: `.kiro/specs/tripslip-platform-architecture/design.md`
- Check the requirements: `.kiro/specs/tripslip-platform-architecture/requirements.md`

---

**Total Estimated Time**: 3-4 weeks for all apps  
**MVP Time**: 1-2 weeks (Parent + Teacher apps only)  
**Status**: Ready to begin implementation
