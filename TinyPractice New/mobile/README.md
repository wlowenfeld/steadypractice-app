# SteadyPractice v3.0.0

A professional session notes app for therapists, coaches, and consultants to track client sessions, manage their schedule, and track revenue.

## v2.3.1 Changes

- **Invoice Detail Screen**: New `invoice/[id].tsx` screen showing client info, status badge, amount, description, dates, sessions covered, and action buttons (Send Invoice, Mark as Paid, Edit Invoice).
- **Fixed Invoice Navigation**: Tapping an invoice from appointment detail, session detail, or the invoices list now navigates to the specific invoice detail screen instead of the full invoices list.

## v3.0.1 Security Fixes

- **Demo Mode Safety**: `isDemoMode` and `_preDemoSnapshot` are no longer persisted to AsyncStorage. If the app crashes during demo mode, the user won't be stuck in demo mode on relaunch.
- **Demo Mode Write Guards**: All mutation actions (add/update/delete for clients, sessions, appointments, invoices) no-op when demo mode is active, preventing accidental data corruption.
- **Crash Recovery**: `_layout.tsx` includes a startup effect that clears demo mode if somehow active on mount.
- **UUID-based IDs**: Replaced `Math.random()` + `Date.now()` ID generation with `uuid` v4 in both `store.ts` and `demoData.ts`, eliminating collision risk when creating entities in tight succession.
- **Defensive Session Deletion**: `deleteSession` now unconditionally removes the deleted session ID from every invoice's `sessionIds` array, preventing orphaned references from partial writes.
- **Removed updateOverdueStatuses**: Eliminated irreversible status mutation that prevented invoices from returning to 'pending' after due date correction. The UI already derives overdue status at render time via `getDisplayStatus()`.
- **linkSessionsToInvoice Returns Status**: Now returns `boolean` so callers (`add-session.tsx`, `add-invoice.tsx`) can detect and alert the user when session linking fails silently.
- **Hydration Race Guard**: Added `isHydrated` flag to the Zustand store, set `true` after `onRehydrateStorage` completes. `loadSampleData()` checks this flag to prevent injecting data before AsyncStorage hydration finishes.
- **RevenueCat Config Error Detection**: `useSubscription` now exposes `isConfigError` flag. In production builds where RevenueCat keys are missing, dashboard and settings show an alert so paying users know their subscription couldn't be verified.
- **Timezone-Safe Date Comparison**: `getAppointmentsForDate()` now compares ISO date strings directly instead of using `setHours(0,0,0,0)`, preventing appointments near midnight UTC from appearing on the wrong day.
- **Full Reset Clears All Data**: `fullReset()` in `security.tsx` now also removes the Zustand persist store (`session-notes-storage`) and resets in-memory state, ensuring a true clean slate.
- **PIN Brute-Force Protection**: `verifyPin()` now tracks failed attempts (persisted in SecureStore). After 5 failed attempts, a 5-minute lockout is enforced. Both `LockScreen` and `change-pin` show a countdown timer during lockout.
- **Invoice Edit Unlinks Removed Sessions**: Editing an invoice now clears `invoiceId` from sessions that were previously linked but are no longer selected, preventing orphaned billing references.
- **Client Detail Selector Optimization**: `client/[id].tsx` now uses `useShallow` filtered selectors instead of subscribing to full `sessions`/`invoices`/`appointments` arrays, reducing unnecessary re-renders when other clients' data changes.
- **Reports Selector Memoization**: `reports.tsx` now uses `useShallow` for store subscriptions so it only re-renders when invoice or client data actually changes, not on unrelated store mutations.
- **Schedule Appointment TZ Safety**: `schedule-appointment.tsx` now parses preselected date strings by extracting YYYY-MM-DD components to avoid UTC-to-local timezone shift that could place the appointment on the wrong day.
- **Session Date Override**: `add-session.tsx` now shows an editable date/time field (defaulting to appointment time or current time) so therapists can adjust the session date when completing an appointment late or logging retroactively.
- **Legacy PIN Hash Migration**: On startup, `security.tsx` detects weak legacy DJB2 PIN hashes (non-SHA-256) and sets a `requiresPinReentry` flag. `LockScreen.tsx` shows a security banner prompting the user to re-enter their PIN. On successful verification against the legacy hash, the PIN is immediately re-hashed with SHA-256 and saved, upgrading all users proactively.

## v3.0.2 Performance Fixes

- **getFilteredClients() Search Optimization**: Hoisted `searchQuery.toLowerCase()` outside the filter callback so it's computed once, not per-client-per-tag.
- **Dashboard Single-Pass Invoice Aggregation**: Consolidated 5 separate `useMemo` array traversals (totalRevenue, outstandingAmount, overdueInvoices, revenueByMonth, recentInvoices) into a single pass over the invoices array.
- **Invoice Counts Single Reduce**: Replaced 3 separate `.filter().length` calls (each invoking `getDisplayStatus()` per invoice) with one `.reduce()` pass that counts all statuses in a single iteration.
- **ClientCard Memoization**: Wrapped the `ClientCard` component with `React.memo()` so it only re-renders when its own props change, not when unrelated clients are added or updated.

## v3.1.0 Pricing & Conversion Changes

- **New Pricing**: Updated to $9.99/mo and $79.99/yr. All hardcoded price strings in onboarding, share messages, and settings replaced. The Paywall component already reads prices dynamically from RevenueCat.
- **Free Client Limit Reduced**: Changed from 5 free clients to 3. The "1 slot remaining" banner now triggers at 2 real clients and is non-dismissible.
- **Simplified Paywall Trigger**: Removed the intermediate upgrade modal with hardcoded plan options. Hitting the client limit now opens the RevenueCat-powered Paywall directly.
- **Paywall Copy & CTA Overhaul**: Headline changed to "Unlock your full practice". Benefits updated to 4 items (unlimited clients, CSV export, backup & restore, priority support). Added value anchor line. CTA now shows dynamic pricing from RevenueCat ("Upgrade for $X.XX/month") with a secondary annual option below.

## v2.0 Changes

- **Theme Overhaul**: Replaced 4-theme system (Light, Dark, Ocean, System) with 2 branded sage themes (Light and Dark). Default is Light. Old theme selections automatically migrate to Light.
- **PIN Security Fix**: PIN hashing now uses SHA-256 via expo-crypto instead of a weak bit-shift hash. Existing PINs are silently migrated on next successful verification.
- **Client Delete Cascade**: Deleting a client now also removes their invoices and appointments (previously only removed sessions).
- **Email Validation**: Client form now validates email format before saving.
- **Appointment Conflict Detection**: Warns when scheduling at a time that already has an appointment.
- **Cross-Client Invoice Validation**: Prevents linking sessions from different clients to the same invoice.
- **Free JSON Backup**: All users can export a full JSON backup of their data (not gated behind Pro).
- **Demo Mode**: Toggle in Settings loads realistic sample data (8 clients, ~58 sessions, 12 invoices, appointments) for exploring the app or taking screenshots.
- **Version bump**: v2.0, build 10
- **In-App Review Prompt**: Uses SKStoreReviewController (expo-store-review) to request App Store reviews at moments of accomplishment — after logging 5+ sessions or sending 1+ invoice. Respects a 120-day cooldown, skips demo mode, and never fires on first launch or after errors.
- **Share SteadyPractice**: "Share SteadyPractice with a Colleague" row in Settings opens the native share sheet with pre-populated referral text and App Store link.
- **Onboarding Redesign**: 4-screen swipe onboarding (Privacy → Session Notes → Practice Tools → Get Started) with mini app preview components, dot indicators, and Skip button. No sample data loaded on first launch — user lands on empty client list with clear "Add Your First Client" CTA. Sample data still available via Demo Mode in Settings.
- **Sample Client & Tooltip**: After onboarding, Clients screen shows "Alex Sample" with a dismissible tooltip. When user adds their first real client, prompted to remove sample data.
- **Conversion Triggers**: Smart nudges at key moments — soft banner at 4 clients ("1 slot remaining"), paywall modal at 6th client ($3.99/mo and $29.99/yr with "Save 37%" badge), review prompt at 5th session, share prompt at 10th session, celebration modal on 1st invoice sent (with delayed review prompt). Priority system prevents stacking: paywall > review > share > celebration.

## Features

- **Client Management**: Add, edit, and archive clients with contact info and tags
- **Session Tracking**: Log sessions with duration, mood indicators, and detailed notes
- **Scheduling Calendar**: Visual month calendar to view and schedule appointments
- **Appointment Booking**: Schedule future sessions with date, time, and duration
- **Follow-up Items**: Track homework and topics to revisit
- **Search & Filter**: Find clients quickly by name or tags
- **Session History**: View all sessions by client or chronologically
- **Data Persistence**: All data saved locally on device
- **Branded Themes**: Sage-toned Light and Dark themes

## New: Light CRM Features

### Dashboard
- **Revenue Overview**: Total revenue and outstanding amounts at a glance
- **Quick Stats**: Active clients and invoice counts
- **Upcoming Appointments**: Next 3 appointments displayed prominently
- **Overdue Alerts**: Highlighted overdue invoices with quick navigation
- **Monthly Revenue**: Revenue breakdown by month with expandable details

### Invoice Management
- **Create Invoices**: Log invoices for each client with amount, description, and due date
- **Invoice Status**: Track pending, paid, and overdue invoices
- **Quick Mark Paid**: One-tap to mark invoices as paid
- **Per-Client Revenue**: See total revenue per client on their profile
- **Session-Linked Invoices**: Invoices can be linked to specific sessions
- **Unbilled Sessions Indicator**: See how many sessions haven't been invoiced yet
- **Post-Session Invoice Prompt**: After completing a session, quickly create an invoice
- **Invoice Status on Sessions**: Session detail screen shows billing status (Pending/Paid/Overdue or "Not Invoiced" with Create Invoice action)
- **Invoice Status on Appointments**: Completed appointment detail shows linked session info and invoice status
- **Batch Invoicing**: Select multiple unbilled sessions when creating an invoice
- **Session Rate**: Set a default rate to auto-fill invoice amounts
- **Email Prompt**: After creating an invoice, prompted to email it to the client

### Reports
- **Revenue Reports**: View all invoices organized by month
- **Export**: Share revenue reports as text via native share sheet
- **Overdue Summary**: Dedicated section for overdue invoices
- **Monthly Breakdown**: Expandable monthly sections showing invoice details

### Client Detail Enhancements
- **Today's Appointment Banner**: Prominent display when client has an appointment today with "Start Session" action
- **Unified Workflow**: Appointments automatically convert to sessions when completed
- **Quick Actions**: Schedule new appointment or create invoice with one tap
- **Meetings Tab**: Combined view of upcoming appointments and past sessions
- **Billed Indicator**: Sessions show "Billed" badge when invoiced
- **Start Session**: Appointments show "Start Session" button when it's time (30 min before or after)
- **Invoices Tab**: Track payments with prominent "Create Invoice" CTA for new clients
- **Ad-hoc Sessions**: Option to log unscheduled sessions for walk-ins or impromptu calls

## Scheduling Calendar

The Schedule tab features:
- **Month Calendar View**: Navigate between months with visual indicators
- **Blue dots**: Days with scheduled appointments
- **Green dots**: Days with completed sessions
- **Day Detail View**: Tap any day to see appointments and sessions
- **Quick Booking**: Tap + to schedule a new appointment
- **Appointment Details**: View, edit, or start a session from any appointment

## Business Model

**Freemium subscription:**
- Free tier: 5 clients, basic features
- Pro tier ($4.99/month or $39.99/year): Unlimited clients, export to CSV, priority support

## Target Market

- Private practice therapists
- Life coaches
- Business consultants
- Personal trainers
- Tutors

## Tech Stack

- Expo SDK 53
- React Native
- Zustand for state management
- AsyncStorage for persistence
- expo-secure-store for PIN storage
- expo-mail-composer for invoice emails
- RevenueCat for in-app purchases
- NativeWind (TailwindCSS)
- Lucide icons

## In-App Purchases (RevenueCat)

The app uses RevenueCat for subscription management:
- **Pro Monthly**: $4.99/month
- **Pro Yearly**: $39.99/year (saves 33%)
- **Entitlement**: "pro" - unlocks all premium features

### Pro Features
- Unlimited clients (free tier limited to 5)
- Export all data to CSV
- Priority support
