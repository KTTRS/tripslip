# TripSlip Platform Functional Flow Blueprint (Post-Remediation Target)

## Purpose

This document describes the **intended complete operating flow** of TripSlip after the audit remediation plan is implemented:
- what each portal does,
- what data each feature reads/writes,
- who can see/share that data,
- and what actions trigger downstream effects.

It is written as an implementation reference so engineering, product, and operations can align on one source of truth.

---

## 1) Platform objective and end-to-end value

TripSlip is a multi-portal field-trip orchestration platform connecting:
- venues that publish educational experiences,
- schools/districts that govern trip approvals,
- teachers that plan and run trips,
- parents/guardians that consent and pay,
- and platform operations that monitor compliance, payment, and reliability.

### Core value chain (current go-to-market)
TripSlip currently centers on **Teacher + Venue + Parent** operations. School workflows are supported but optional.

1. Trip can start in either path:
   - **Venue-first**: venue creates/publishes an experience and sends teacher-invite link.
   - **Teacher-first**: teacher creates trip package directly and optionally links venue later.
2. Teacher configures trip details, roster, consent requirements, and parent-share links.
3. Parent/guardian opens link, completes consent/signature, and payment (if required).
4. Venue receives booking/information link when teacher decides to engage venue-side workflow.
5. School approval is only inserted if a school account exists and policy requires it.
6. Platform finalizes trip readiness, completion tracking, reconciliation, and reporting.

### Supported creation entry modes

### Account-friction policy for venue-invited teachers
- A venue-invited teacher should be able to start immediately from the link with minimal fields.
- Signup is encouraged but **not required at first touch**.
- Critical artifact protection rule: the final/shareable manifest is withheld until teacher identity is finalized via signup/login.
- UX principle: ask for account creation only after meaningful progress has been made (progressive conversion, not front-loaded friction).

#### Mode A — Venue-first initiation
1. Venue creates experience and clicks “share with teacher”.
2. Platform creates teacher invitation URL containing venue/experience context.
3. Teacher can:
   - continue in lightweight guest mode (no immediate account required),
   - accept as new user (signup), or
   - accept as existing user (login).
4. Teacher lands in prefilled trip-setup flow with venue details attached.
5. Teacher can complete planning/distribution steps without being forced to fully register up front.
6. The finalized manifest package is access-gated behind signup/login completion.
7. Teacher continues with roster, parent links, consent/payment, and status tracking with progressive prompts to create an account when value is clear.

#### Mode B — Teacher-first initiation
1. Teacher creates trip package without requiring venue account linkage up front.
2. Teacher configures students/guardians and generates parent consent links.
3. Teacher tracks responses and payment progress directly.
4. When ready, teacher can generate/share a venue information link or formal booking request.
5. Venue can then review and confirm details with minimal re-entry.

---

## 2) Portals and what each one does

## A. Landing portal (`tripslip.com`)

### Primary function
- Public entrypoint for product education, pricing, and role-specific onboarding.

### Key features
- Marketing pages and feature explanations.
- Role-based CTA routing (Venue, School, Teacher, Parent).
- Authentication handoff to the selected portal.

### Data behavior
- Reads static content and analytics events.
- Does **not** own trip operational records.

### Triggers
- Clicking role CTA triggers redirect + optional prefill for signup context.

---

## B. Venue portal (`venue.tripslip.com`)

### Primary function
- Lets venues create/manage experiences, availability, bookings, and payouts.

### Key features
1. **Venue profile management**
   - Description, website, educational fit, logistics, photos.
2. **Experience management**
   - Create/edit offerings (title, description, grade targets, capacity, cost, requirements).
3. **Availability & capacity controls**
   - Blocked dates, timeslots, capacity overrides.
4. **Booking management**
   - Accept/decline booking requests, communicate constraints.
5. **Financial dashboards**
   - View incoming payments, payout status, refund history.
6. **Team/employee access**
   - Invite employees, assign venue-side permissions.

### Data written
- Experience records, availability settings, booking status updates, venue profile updates.

### Data read
- Incoming booking requests, teacher/school context for approved trips, payment summaries.

### Sharing model
- Shared to Teacher/School search results as discoverable venue data.
- Shared to Parent view only for booked trip-specific details (not full internal analytics).

### Trigger flows
- **Experience publish** → appears in teacher search index.
- **Capacity/date change** → re-validates pending requests and can trigger teacher notifications.
- **Booking confirmation** → transitions trip state for teacher/school.
- **Refund initiated** → triggers payment workflow + audit record.

---

## C. School portal (`school.tripslip.com`)

### Primary function
- Administrative governance for schools/districts: policy, approvals, teacher oversight.
- **Important:** This is optional in the active operating model and should never block teachers when no school account/policy exists.

### Key features
1. **Organization management**
   - District/school profile and role assignments.
2. **Teacher management**
   - Invite/manage teachers, organizational affiliation.
3. **Trip approval workflows**
   - Review submitted trips, request changes, approve/reject.
4. **Compliance visibility**
   - Track consent completion, payment status, outstanding risk items.
5. **Audit and reporting**
   - Export operational logs and trip outcomes.

### Data written
- Approval decisions, reviewer comments, teacher membership records.

### Data read
- Teacher trip submissions, venue booking statuses, consent/payment rollups.

### Sharing model
- Shares approval outcome to Teacher + Venue workflows.
- Shares organization-level constraints to trip creation logic.

### Trigger flows
- **Approve trip** → unlocks guardian consent distribution and final booking progression.
- **Reject trip** → sends actionable reason to teacher; trip returns to draft/revision.
- **Teacher invited/removed** → updates access scope in all linked data views.
- **No school policy present** → trip bypasses school-approval gate and continues teacher-managed lifecycle.

---

## D. Teacher portal (`teacher.tripslip.com`)

### Primary function
- Operational control center for trip planning, roster setup, and parent coordination.
- Supports both independent teacher operation and organization-governed operation.

### Key features
1. **Venue search/discovery**
   - Find experiences by location, grade fit, category, availability.
2. **Trip planning**
   - Build trip details (date, objective, roster, costs, documents).
3. **Roster and guardian management**
   - Manage students and associated guardian contacts.
4. **Consent package creation**
   - Configure required forms and trip-specific policies.
5. **Distribution + tracking**
   - Send consent links; track opened/signed/pending.
6. **Trip operations dashboard**
   - See approval, booking, payment, and completion status.

### Data written
- Trips, students, guardian links, permission-request packages, teacher notes.

### Data read
- Venue catalog + availability, school approval status, guardian response/payment status.

### Sharing model
- Trip packet shared to School for approval and Parent for consent.
- Booking request details shared with Venue.

### Trigger flows
- **Submit trip for approval** → creates school review task.
- **Send consent requests** → creates per-student permission records and outbound notifications.
- **Roster update** → may create/remove guardian consent obligations.
- **Trip marked complete** → closes active consent/payment collection and starts reporting windows.
- **No school attached** → `submit` action routes directly to parent-consent (and venue flow if selected) instead of creating school task.
- **Venue invite accepted** → pre-populates teacher trip draft with venue/experience context.
- **Guest teacher reaches manifest/export step** → trigger seamless signup/login checkpoint, then unlock manifest and sharing actions.

---

## E. Parent portal (`parent.tripslip.com`)

### Primary function
- Guardian interface for reviewing trip details, consenting, submitting forms, and paying.

### Key features
1. **Secure invitation access**
   - Tokenized link or authenticated entry to student-specific slip.
2. **Trip detail review**
   - Date/time/location, educational purpose, requirements.
3. **Digital consent + signature**
   - Complete required fields and sign digitally.
4. **Payment flow**
   - Required fee + optional donation/split contributions where supported.
5. **Receipt/history**
   - Confirmation status and payment receipts.

### Data written
- Form responses, signature artifacts, payment transaction intents/results.

### Data read
- Student-specific trip packet and payment obligations.

### Sharing model
- Consent state shared to Teacher/School dashboards.
- Payment state shared to Teacher/Venue finance views (role-scoped).

### Trigger flows
- **Slip opened** → status update and teacher visibility.
- **Consent completed** → student marked cleared (if all required items complete).
- **Payment success/failure** → status update, receipts/alerts, reconciliation queue updates.

---

## 3) Information storage model (what is stored where)

## Primary system of record: Supabase Postgres

### Core domain entities (conceptual)
- Venue and experience catalog.
- Organization hierarchy (district, school, teacher membership).
- Trip records and lifecycle states.
- Student roster and guardian relationships.
- Permission/consent records (including status timeline).
- Payment/refund transaction records.
- Notifications and audit logs.

### Confirmed currently-present baseline schema entities
- `experiences`, `invitations`, `students`, `guardians`, `permission_slips`, `payments`.
- Automatic `updated_at` triggers.
- Permission slip token generation trigger.

### Storage buckets
- Documents/media (trip docs, forms, uploads, venue images).

### Security model
- Authenticated identity with role context.
- RLS policies enforce row-level visibility by actor and organization.
- Audit trail for sensitive status transitions and financial events.

---

## 4) Who sees what (data-sharing boundaries)

## Venue user sees
- Their own venue profile, experiences, booking requests, payout/refund data.
- Not full parent PII beyond what is required for trip execution/contact policy.

## School admin sees
- Trips tied to their org, approvals, compliance summaries, teacher membership.
- Not cross-organization data.

## Teacher sees
- Their trips, roster, guardian response states, selected venue booking states.
- Not other teachers’ private rosters unless explicitly delegated.

## Parent/guardian sees
- Only the slips/trips linked to their student invitation context.
- Not school-wide or venue-internal analytics.

## Platform operations sees
- Cross-tenant observability/audit metadata for support, reliability, and compliance tasks under strict privilege boundaries.

---

## 5) Lifecycle state machine (high level)

## Trip lifecycle (target)
`draft -> submitted_for_approval -> approved -> booking_confirmed -> consent_open -> ready_to_go -> completed -> archived`

### Trip lifecycle (current default without school requirement)
`draft -> venue_linked_optional -> consent_open -> ready_to_go -> completed -> archived`

### Important transition triggers
- `draft -> submitted_for_approval`: teacher submits trip.
- `submitted_for_approval -> approved/rejected`: school decision.
- `approved -> booking_confirmed`: venue confirmation.
- `booking_confirmed -> consent_open`: teacher sends guardian requests.
- `consent_open -> ready_to_go`: all mandatory consents (and required payments) complete.
- `ready_to_go -> completed`: teacher marks trip completed (or automatic after event date with checks).

### Conditional routing rule
- If school governance is **not configured** for the teacher, skip `submitted_for_approval` and route straight from trip setup into consent/venue engagement flows.
- If school governance **is configured and required**, enforce the approval path before final readiness.

## Permission slip lifecycle (target)
`pending -> sent -> opened -> completed` (+ `expired` / `voided` operational branches)

## Payment lifecycle (target)
`intent_created -> authorized -> captured -> settled` (+ `failed` / `refunded` branches)

---

## 6) Cross-portal trigger map (action -> downstream effects)

1. **Venue updates experience pricing/capacity**
   - Re-index search results.
   - Recalculate teacher trip budget warnings.
   - Trigger alerts where pending bookings are impacted.

2. **Teacher submits trip**
   - If school-required: create school approval task and apply governance rules.
   - If school-not-required: continue directly to consent distribution and optional venue coordination.
   - Locking/editability is policy-driven by governance mode.

3. **School approves trip**
   - Enable booking finalization and parent consent distribution.
   - Write approval log entry + notify teacher.

4. **Teacher sends consent requests**
   - Generate student-specific slip records/tokens.
   - Dispatch notification jobs (email/SMS).
   - Parent portal links become active.

5. **Parent signs + pays**
   - Update consent/payment status.
   - Push completion to teacher dashboard and school compliance rollup.
   - Add financial event to venue payout ledger.

6. **Venue initiates refund / admin processes refund**
   - Payment status updates to refunded.
   - Parent + teacher notified.
   - Financial and audit records appended.

7. **Trip completed**
   - Freeze operational editing.
   - Generate exportable summary/reporting views.
   - Enter retention/archive lifecycle.

---

## 6.5) Seamless-experience requirements (Teacher + Venue + Parent)

1. **One-link start for invited teachers**
   - Venue shares one link; teacher enters directly into prefilled flow.
2. **Progressive data capture**
   - Collect only the minimum needed each step; defer non-essential fields.
3. **No forced school dependency**
   - School steps appear only if school policy is configured as required.
4. **Low-friction parent completion**
   - Parent link should open directly to student-specific consent/payment context with no extra navigation.
5. **Manifest protection with minimal friction**
   - Keep planning flow open in guest mode; enforce signup only at manifest unlock/export/share milestone.
6. **Cross-portal clarity**
   - Every status change should show plain-language next steps for teacher, venue, and parent.

---

## 7) Notifications and communications

### Notification channels
- Email (default), optional SMS for urgent reminders.

### Trigger examples
- New approval needed (school admin).
- Trip approved/rejected (teacher).
- Consent reminder (guardian).
- Booking change/cancellation (teacher + venue + optionally school).
- Payment success/failure/refund (guardian + teacher + venue finance scope).

### Delivery architecture
- App action/event -> notification job record -> channel provider -> delivery result -> status persisted for retry/reporting.

---

## 8) Reporting and population targets

## Teacher dashboards populate from
- Trip status, roster size, consent completion, payment completion, venue booking state.

## School dashboards populate from
- Approval queues, overdue approvals, compliance completion, trip outcomes by teacher/school.

## Venue dashboards populate from
- Upcoming bookings, attendance projections, gross receipts, refunds, payout status.

## Parent portal status populates from
- Student-specific permission state + payment state + trip metadata.

## Platform-level ops populate from
- Audit logs, failure queues, delivery metrics, payment exception queues.

---

## 9) Implementation constraints to enforce while executing the audit plan

1. **Single source-of-truth docs**: one canonical runbook and one canonical functional flow (this doc) to remove contradictory instructions.
2. **Version consistency**: lock Vite/Vitest/tooling versions workspace-wide.
3. **Schema clarity**: separate active migrations from archived/deactivated SQL artifacts.
4. **RLS correctness**: replace permissive placeholder policies with role-scoped production policies.
5. **Event reliability**: make cross-portal triggers idempotent and auditable.
6. **Data minimization**: expose only required fields to each role.
7. **Operational observability**: every state transition should be traceable in logs/audit events.

---

## 10) Practical “what the platform will have” summary after the remediation work

After implementation, TripSlip will provide:
- A **cohesive 5-portal workflow** from discovery to trip closeout.
- **Dual initiation flexibility** (venue-first or teacher-first) without forcing school adoption.
- **Low-friction venue-invite onboarding** where teachers can start without immediate signup, with manifest unlock gated at account completion.
- **Deterministic data flow** where each action updates clear downstream states.
- **Role-correct sharing** so each actor sees only what they should.
- **Reliable parent consent/payment pipeline** feeding teacher, school, and venue operations.
- **Traceable compliance/finance lifecycle** through audit and reporting.
- **Stable engineering operations** through standardized tooling, cleaned migrations, and non-contradictory documentation.
