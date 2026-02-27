export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  lastSessionAt?: string;
  sessionCount: number;
  isArchived: boolean;
}

export interface Session {
  id: string;
  clientId: string;
  date: string;
  duration: number; // minutes
  notes: string;
  mood?: 'great' | 'good' | 'neutral' | 'difficult' | 'challenging';
  followUp?: string;
  createdAt: string;
  invoiceId?: string; // Links to invoice if billed
}

export interface ScheduledAppointment {
  id: string;
  clientId: string;
  scheduledDate: string; // ISO date string
  duration: number; // minutes
  notes?: string;
  isCompleted: boolean;
  completedSessionId?: string; // links to the session when marked complete
  createdAt: string;
}

export type MoodOption = {
  value: Session['mood'];
  label: string;
  color: string;
};

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 'great', label: 'Great', color: '#10B981' },
  { value: 'good', label: 'Good', color: '#34D399' },
  { value: 'neutral', label: 'Neutral', color: '#9CA3AF' },
  { value: 'difficult', label: 'Difficult', color: '#F59E0B' },
  { value: 'challenging', label: 'Challenging', color: '#EF4444' },
];

export const DEFAULT_TAGS = [
  'Weekly',
  'Bi-weekly',
  'Monthly',
  'New Client',
  'VIP',
  'Insurance',
  'Private Pay',
];

// CRM Types
export type InvoiceStatus = 'pending' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  clientId: string;
  amount: number;
  description: string;
  dueDate: string;
  status: InvoiceStatus;
  paidDate?: string;
  createdAt: string;
  sessionIds: string[]; // Which sessions this invoice covers (can be empty for non-session invoices)
}

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#B45309' },
  paid: { bg: '#D1FAE5', text: '#047857' },
  overdue: { bg: '#FEE2E2', text: '#DC2626' },
};

/**
 * Compute display status for an invoice at render time.
 * Stored status stays as 'pending' or 'paid' — this derives 'overdue' from the due date.
 */
export function getDisplayStatus(invoice: Invoice): InvoiceStatus {
  if (invoice.status === 'paid') return 'paid';
  const now = new Date();
  const dueDate = new Date(invoice.dueDate);
  if (dueDate < now) return 'overdue';
  return 'pending';
}

export const CLIENT_CATEGORIES = [
  'VIP',
  'New Client',
  'Active',
  'Inactive',
  'On Hold',
] as const;
