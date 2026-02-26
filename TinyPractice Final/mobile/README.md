# TinyPractice v3.0.0

A professional session notes app for therapists, coaches, and consultants to track client sessions, manage their schedule, and track revenue.

## v2.3.1 Changes

- **Invoice Detail Screen**: New `invoice/[id].tsx` screen showing client info, status badge, amount, description, dates, sessions covered, and action buttons (Send Invoice, Mark as Paid, Edit Invoice).
- **Fixed Invoice Navigation**: Tapping an invoice from appointment detail, session detail, or the invoices list now navigates to the specific invoice detail screen instead of the full invoices list.

## v2.0 Changes

- **Theme Overhaul**: Replaced 4-theme system (Light, Dark, Ocean, System) with 2 branded sage themes (Light and Dark). Default is Light. Old theme selections automatically migrate to Light.
- **PIN Security Fix**: PIN hashing now uses SHA-256 via expo-crypto instead of a weak bit-shift hash. Existing PINs are silently migrated on next successful verification.
- **Client Delete Cascade**: Deleting a client now also removes their invoices and appointments (previously only removed sessions).
- **Email Validation**: Client form now validates email format before saving.
- **Appointment Conflict Detection**: Warns when scheduling at a time that already has an appointment.
- **Auto-Update Overdue Invoices**: Invoice statuses automatically update to overdue when past due date on app resume.
- **Cross-Client Invoice Validation**: Prevents linking sessions from different clients to the same invoice.
- **Free JSON Backup**: All users can export a full JSON backup of their data (not gated behind Pro).
- **Demo Mode**: Toggle in Settings loads realistic sample data (8 clients, ~58 sessions, 12 invoices, appointments) for exploring the app or taking screenshots.
- **Version bump**: v2.0, build 10
- **In-App Review Prompt**: Uses SKStoreReviewController (expo-store-review) to request App Store reviews at moments of accomplishment — after logging 5+ sessions or sending 1+ invoice. Respects a 120-day cooldown, skips demo mode, and never fires on first launch or after errors.
- **Share TinyPractice**: "Share TinyPractice with a Colleague" row in Settings opens the native share sheet with pre-populated referral text and App Store link.
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

## Security & Privacy

### PIN Lock Protection
- **Required PIN**: 4-digit PIN required to access the app
- **PIN Setup**: First-time users must create a PIN before using the app
- **Change PIN**: Update your PIN anytime from Settings
- **Lock App**: Manually lock the app from Settings
- **Auto-Lock**: App automatically locks after 1 minute in background

### Privacy Notice
- **First Launch Notice**: Privacy notice shown on first launch
- **User Acknowledgment**: Users must acknowledge they understand their responsibilities
- **Data Storage Info**: Clear explanation that all data is stored locally on device only
- **User Responsibilities**: Guidelines for device security and data protection

### Onboarding Flow (First Launch)
- **4-Screen Swipe Onboarding**: Horizontal paging through Privacy, Session Notes, Practice Tools, and Get Started screens
- **Screen 1 — Privacy**: Shield icon, "Local Storage Only" device badge, "Your data never leaves this device."
- **Screen 2 — Session Notes**: Mini session note preview (styled View), "Session notes that stay private."
- **Screen 3 — Practice Tools**: Three mini preview cards (Schedule, Invoices, Clients), "Scheduling. Invoicing. Clients."
- **Screen 4 — Get Started**: Pricing info ("Free for your first 5 clients. $3.99/month when you're ready for more.") with full-width CTA button
- **Skip button**: Top-right on screens 1-3, completes onboarding immediately
- **Dot indicators**: Bottom of screen, active dot is wider pill shape
- **No sample data on first launch**: User lands on empty client list with "Add Your First Client" CTA
- **Sample data still available via Demo Mode** in Settings — tooltip and "Remove sample data?" prompt only appear when sample data exists
- **No email collection, no account creation**
- **Replay**: Can replay from Settings (shows full swipe onboarding again)

### Invoice Email Generation
- **One-Tap Email**: Send invoices to clients with a single tap
- **Professional Format**: Auto-generated invoice email with all details
- **Business Name**: Customizable business name appears on invoices
- **Payment Instructions**: Custom payment instructions included in every invoice
- **First Invoice Setup**: Prompted to set payment instructions on first invoice
- **Clipboard Fallback**: Copy to clipboard if no email app available

### Privacy Features
- **Local Storage Only**: All data stored on device, never transmitted
- **No Cloud Sync**: No external servers or cloud services used
- **User Controlled**: Users responsible for device backups

## Screens

- **Dashboard Tab**: Revenue overview, quick stats, and recent invoices
- **Clients Tab**: View and search all clients
- **Schedule Tab**: Calendar view with upcoming appointments and past sessions
- **Settings Tab**: App settings, theme selection, security, and data management
- **Reports**: Detailed revenue reports with export functionality

## Settings

- **Business Name**: Set your business name for invoices
- **Payment Instructions**: Set default payment instructions for invoices (Venmo, Zelle, etc.)
- **Session Rate**: Set default rate per session for auto-filling invoices
- **Appearance**: Light (sage light) or Dark (sage dark) theme
- **Change PIN**: Update your security PIN
- **Lock App Now**: Immediately lock the app
- **Upgrade to Pro**: Subscription management
- **Export Data**: Download your data as CSV
- **Privacy & Data Policy**: View privacy information
- **Replay Tutorial**: View the onboarding again
- **Get Help**: Contact support
- **Clear All Data**: Delete all app data
- **Full Reset**: Reset app to new user state

## Premium Conversion

### Soft Nudge (4th client added)
- Dismissible banner on Clients screen: "You have 1 free client slot remaining."
- Subtle amber/yellow styling — informational, not alarming
- Dismiss on tap, stored in AsyncStorage

### Paywall Modal (6th client attempted)
- Full modal when tapping "+" to add 6th client
- "Upgrade to Pro for unlimited clients."
- Monthly: $3.99/mo | Annual: $29.99/yr with "Save 37%" badge
- Annual option visually prominent (green border, "Best Value" tag)
- "Restore Purchases" and "Maybe Later" options
- Opens full RevenueCat paywall for actual purchase

### 5th Session — Review Prompt
- Triggers SKStoreReviewController after 5th session logged
- Respects 120-day cooldown

### 10th Session — Share Prompt
- Non-blocking modal: "Enjoying TinyPractice? Share it with a colleague."
- Share button opens native share sheet with referral text
- Dismissible, shown once only (tracked in AsyncStorage)

### 1st Invoice Sent — Celebration
- Full celebration modal: "Your first invoice is on its way!" with animated checkmark
- After 2-second delay, triggers review prompt (if conditions met)
- Shown once only

### Priority System (No Stacking)
- paywall > review > share > celebration
- Only one prompt per action; lower-priority prompts skipped

### Pro Features Preview (Dashboard)
- Shows locked Pro features on dashboard
- Unlimited Clients, CSV Export
- Tapping any feature leads to upgrade paywall

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
