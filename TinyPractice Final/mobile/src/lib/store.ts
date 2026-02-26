import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client, Session, ScheduledAppointment, Invoice, InvoiceStatus } from './types';
import { generateDemoData } from './demoData';

export type ThemeMode = 'light' | 'dark';

interface AppState {
  clients: Client[];
  sessions: Session[];
  appointments: ScheduledAppointment[];
  invoices: Invoice[];
  searchQuery: string;
  showArchived: boolean;
  themeMode: ThemeMode;

  // Actions
  setSearchQuery: (query: string) => void;
  setShowArchived: (show: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;

  // Client actions
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'sessionCount' | 'isArchived'>) => string;
  updateClient: (id: string, updates: Partial<Client>) => void;
  archiveClient: (id: string) => void;
  deleteClient: (id: string) => void;

  // Session actions
  addSession: (session: Omit<Session, 'id' | 'createdAt'>) => string;
  updateSession: (id: string, updates: Partial<Session>) => void;
  deleteSession: (id: string) => void;

  // Appointment actions
  addAppointment: (appointment: Omit<ScheduledAppointment, 'id' | 'createdAt' | 'isCompleted'>) => string;
  updateAppointment: (id: string, updates: Partial<ScheduledAppointment>) => void;
  deleteAppointment: (id: string) => void;
  completeAppointment: (appointmentId: string, sessionId: string) => void;

  // Invoice actions
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => string;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  markInvoicePaid: (id: string) => void;

  // Selectors
  getClient: (id: string) => Client | undefined;
  getClientSessions: (clientId: string) => Session[];
  getFilteredClients: () => Client[];
  getAppointmentsForDate: (date: string) => ScheduledAppointment[];
  getUpcomingAppointments: () => ScheduledAppointment[];
  getClientInvoices: (clientId: string) => Invoice[];
  getClientAppointments: (clientId: string) => ScheduledAppointment[];
  getClientUnbilledSessions: (clientId: string) => Session[];
  getOverdueInvoices: () => Invoice[];
  getTotalRevenue: () => number;
  getClientTotalRevenue: (clientId: string) => number;
  getOutstandingAmount: () => number;
  getRevenueByMonth: () => { month: string; revenue: number }[];
  linkSessionsToInvoice: (sessionIds: string[], invoiceId: string) => void;
  updateOverdueStatuses: () => void;

  // Demo mode
  isDemoMode: boolean;
  _preDemoSnapshot: {
    clients: Client[];
    sessions: Session[];
    appointments: ScheduledAppointment[];
    invoices: Invoice[];
  } | null;
  loadDemoData: () => void;
  clearDemoData: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      clients: [],
      sessions: [],
      appointments: [],
      invoices: [],
      searchQuery: '',
      showArchived: false,
      themeMode: 'light',

      setSearchQuery: (query) => set({ searchQuery: query }),
      setShowArchived: (show) => set({ showArchived: show }),
      setThemeMode: (mode) => set({ themeMode: mode }),

      addClient: (clientData) => {
        const id = generateId();
        const client: Client = {
          ...clientData,
          id,
          createdAt: new Date().toISOString(),
          sessionCount: 0,
          isArchived: false,
        };
        set((state) => ({ clients: [client, ...state.clients] }));
        return id;
      },

      updateClient: (id, updates) => {
        set((state) => ({
          clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },

      archiveClient: (id) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, isArchived: !c.isArchived } : c
          ),
        }));
      },

      deleteClient: (id) => {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
          sessions: state.sessions.filter((s) => s.clientId !== id),
          invoices: state.invoices.filter((i) => i.clientId !== id),
          appointments: state.appointments.filter((a) => a.clientId !== id),
        }));
      },

      addSession: (sessionData) => {
        const id = generateId();
        const session: Session = {
          ...sessionData,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          const updatedClients = state.clients.map((c) => {
            if (c.id !== sessionData.clientId) return c;

            // Only update lastSessionAt if this session is more recent
            const existingLast = c.lastSessionAt ? new Date(c.lastSessionAt).getTime() : 0;
            const newSessionTime = new Date(sessionData.date).getTime();
            const newLastSessionAt = newSessionTime > existingLast ? sessionData.date : c.lastSessionAt;

            return {
              ...c,
              sessionCount: c.sessionCount + 1,
              lastSessionAt: newLastSessionAt,
            };
          });
          return {
            sessions: [session, ...state.sessions],
            clients: updatedClients,
          };
        });
        return id;
      },

      updateSession: (id, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        }));
      },

      deleteSession: (id) => {
        const session = get().sessions.find((s) => s.id === id);
        if (!session) return;

        // Get remaining sessions for this client (excluding the one being deleted)
        const remainingSessions = get().sessions
          .filter((s) => s.clientId === session.clientId && s.id !== id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const newLastSessionAt = remainingSessions.length > 0 ? remainingSessions[0].date : undefined;

        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          clients: state.clients.map((c) =>
            c.id === session.clientId
              ? {
                  ...c,
                  sessionCount: Math.max(0, c.sessionCount - 1),
                  lastSessionAt: newLastSessionAt,
                }
              : c
          ),
          // Remove this session from any invoice's sessionIds array
          invoices: session.invoiceId
            ? state.invoices.map((inv) =>
                inv.id === session.invoiceId
                  ? { ...inv, sessionIds: inv.sessionIds.filter((sid) => sid !== id) }
                  : inv
              )
            : state.invoices,
        }));
      },

      // Appointment actions
      addAppointment: (appointmentData) => {
        const id = generateId();
        const appointment: ScheduledAppointment = {
          ...appointmentData,
          id,
          createdAt: new Date().toISOString(),
          isCompleted: false,
        };
        set((state) => ({ appointments: [appointment, ...state.appointments] }));
        return id;
      },

      updateAppointment: (id, updates) => {
        set((state) => ({
          appointments: state.appointments.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        }));
      },

      deleteAppointment: (id) => {
        set((state) => ({
          appointments: state.appointments.filter((a) => a.id !== id),
        }));
      },

      completeAppointment: (appointmentId, sessionId) => {
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === appointmentId
              ? { ...a, isCompleted: true, completedSessionId: sessionId }
              : a
          ),
        }));
      },

      getClient: (id) => get().clients.find((c) => c.id === id),

      getClientSessions: (clientId) =>
        get()
          .sessions.filter((s) => s.clientId === clientId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),

      getFilteredClients: () => {
        const { clients, searchQuery, showArchived } = get();
        return clients
          .filter((c) => (showArchived ? true : !c.isArchived))
          .filter((c) =>
            searchQuery
              ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
              : true
          )
          .sort((a, b) => {
            // Sort by last session date, then by name
            if (a.lastSessionAt && b.lastSessionAt) {
              return new Date(b.lastSessionAt).getTime() - new Date(a.lastSessionAt).getTime();
            }
            if (a.lastSessionAt) return -1;
            if (b.lastSessionAt) return 1;
            return a.name.localeCompare(b.name);
          });
      },

      getAppointmentsForDate: (date) => {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        return get()
          .appointments.filter((a) => {
            const appointmentDate = new Date(a.scheduledDate);
            appointmentDate.setHours(0, 0, 0, 0);
            return appointmentDate.getTime() === targetDate.getTime();
          })
          .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
      },

      getUpcomingAppointments: () => {
        const now = new Date();
        return get()
          .appointments.filter((a) => !a.isCompleted && new Date(a.scheduledDate) >= now)
          .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
      },

      // Invoice actions
      addInvoice: (invoiceData) => {
        const id = generateId();
        const invoice: Invoice = {
          ...invoiceData,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ invoices: [invoice, ...state.invoices] }));
        return id;
      },

      updateInvoice: (id, updates) => {
        set((state) => ({
          invoices: state.invoices.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv)),
        }));
      },

      deleteInvoice: (id) => {
        const invoice = get().invoices.find((inv) => inv.id === id);
        set((state) => ({
          invoices: state.invoices.filter((inv) => inv.id !== id),
          // Clear invoiceId on all sessions that were linked to this invoice
          sessions: invoice
            ? state.sessions.map((s) =>
                invoice.sessionIds.includes(s.id) ? { ...s, invoiceId: undefined } : s
              )
            : state.sessions,
        }));
      },

      markInvoicePaid: (id) => {
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id
              ? { ...inv, status: 'paid' as InvoiceStatus, paidDate: new Date().toISOString() }
              : inv
          ),
        }));
      },

      // CRM Selectors
      getClientInvoices: (clientId) =>
        get()
          .invoices.filter((inv) => inv.clientId === clientId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      getClientAppointments: (clientId) =>
        get()
          .appointments.filter((a) => a.clientId === clientId)
          .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()),

      getClientUnbilledSessions: (clientId) =>
        get()
          .sessions.filter((s) => s.clientId === clientId && !s.invoiceId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),

      linkSessionsToInvoice: (sessionIds, invoiceId) => {
        const state = get();
        const invoice = state.invoices.find((i) => i.id === invoiceId);
        if (!invoice) return;

        const sessionsToLink = state.sessions.filter((s) => sessionIds.includes(s.id));
        const allSameClient = sessionsToLink.every((s) => s.clientId === invoice.clientId);
        if (!allSameClient) return; // Silently reject cross-client linking

        set((state) => ({
          sessions: state.sessions.map((s) =>
            sessionIds.includes(s.id) ? { ...s, invoiceId } : s
          ),
        }));
      },

      updateOverdueStatuses: () => {
        const now = new Date();
        set((state) => ({
          invoices: state.invoices.map((inv) => {
            if (inv.status === 'paid') return inv;
            const dueDate = new Date(inv.dueDate);
            if (dueDate < now && inv.status !== 'overdue') {
              return { ...inv, status: 'overdue' as const };
            }
            return inv;
          }),
        }));
      },

      getOverdueInvoices: () => {
        const now = new Date();
        return get().invoices.filter((inv) => {
          if (inv.status === 'paid') return false;
          const dueDate = new Date(inv.dueDate);
          return dueDate < now;
        });
      },

      getTotalRevenue: () =>
        get()
          .invoices.filter((inv) => inv.status === 'paid')
          .reduce((sum, inv) => sum + inv.amount, 0),

      getClientTotalRevenue: (clientId) =>
        get()
          .invoices.filter((inv) => inv.clientId === clientId && inv.status === 'paid')
          .reduce((sum, inv) => sum + inv.amount, 0),

      getOutstandingAmount: () =>
        get()
          .invoices.filter((inv) => inv.status !== 'paid')
          .reduce((sum, inv) => sum + inv.amount, 0),

      getRevenueByMonth: () => {
        const invoices = get().invoices.filter((inv) => inv.status === 'paid' && inv.paidDate);
        const monthlyRevenue: Record<string, number> = {};

        invoices.forEach((inv) => {
          const date = new Date(inv.paidDate!);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + inv.amount;
        });

        return Object.entries(monthlyRevenue)
          .map(([month, revenue]) => ({ month, revenue }))
          .sort((a, b) => b.month.localeCompare(a.month));
      },

      // Demo mode
      isDemoMode: false,
      _preDemoSnapshot: null,

      loadDemoData: () => {
        const state = get();
        const demo = generateDemoData();
        set({
          _preDemoSnapshot: {
            clients: state.clients,
            sessions: state.sessions,
            appointments: state.appointments,
            invoices: state.invoices,
          },
          isDemoMode: true,
          clients: demo.clients,
          sessions: demo.sessions,
          invoices: demo.invoices,
          appointments: demo.appointments,
        });
      },

      clearDemoData: () => {
        const snapshot = get()._preDemoSnapshot;
        set({
          isDemoMode: false,
          _preDemoSnapshot: null,
          clients: snapshot?.clients ?? [],
          sessions: snapshot?.sessions ?? [],
          invoices: snapshot?.invoices ?? [],
          appointments: snapshot?.appointments ?? [],
        });
      },
    }),
    {
      name: 'session-notes-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        clients: state.clients,
        sessions: state.sessions,
        appointments: state.appointments,
        invoices: state.invoices,
        themeMode: state.themeMode,
        isDemoMode: state.isDemoMode,
        _preDemoSnapshot: state._preDemoSnapshot,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.themeMode !== 'light' && state.themeMode !== 'dark') {
          state.themeMode = 'light';
        }
      },
    }
  )
);
