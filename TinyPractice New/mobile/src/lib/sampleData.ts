import { useAppStore } from './store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAMPLE_CLIENT_ID = 'sample-alex-client';
const SAMPLE_DATA_LOADED_KEY = 'sample_data_loaded';
export const SAMPLE_TOOLTIP_DISMISSED_KEY = 'sample_tooltip_dismissed';
export const SAMPLE_DATA_REMOVED_KEY = 'sample_data_removed';

/**
 * Load the "Alex Sample" client with pre-populated sessions and a draft invoice.
 * Called once after onboarding completes.
 */
export function loadSampleData(): void {
  const store = useAppStore.getState();

  // Don't load before hydration completes — data isn't ready yet
  if (!store.isHydrated) return;

  // Don't load if already loaded or if user already has data
  if (store.clients.some((c) => c.id === SAMPLE_CLIENT_ID)) return;

  const now = new Date();
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const fiveDaysAgo = new Date(now);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const sessionId1 = 'sample-session-1';
  const sessionId2 = 'sample-session-2';
  const invoiceId = 'sample-invoice-1';

  useAppStore.setState((state) => ({
    clients: [
      {
        id: SAMPLE_CLIENT_ID,
        name: 'Alex Sample',
        email: 'alex@example.com',
        phone: '(555) 012-3456',
        notes: 'Sample client to help you explore the app. Feel free to delete anytime.',
        tags: ['Weekly', 'New Client'],
        createdAt: fiveDaysAgo.toISOString(),
        lastSessionAt: twoDaysAgo.toISOString(),
        sessionCount: 2,
        isArchived: false,
      },
      ...state.clients,
    ],
    sessions: [
      {
        id: sessionId1,
        clientId: SAMPLE_CLIENT_ID,
        date: fiveDaysAgo.toISOString(),
        duration: 50,
        notes: 'Initial intake session. Discussed goals, background, and expectations for our work together. Alex is motivated and engaged.',
        mood: 'good' as const,
        followUp: 'Send intake paperwork. Schedule weekly recurring sessions.',
        createdAt: fiveDaysAgo.toISOString(),
      },
      {
        id: sessionId2,
        clientId: SAMPLE_CLIENT_ID,
        date: twoDaysAgo.toISOString(),
        duration: 50,
        notes: 'Follow-up session. Reviewed progress on initial goals. Explored new strategies for managing stress. Good rapport building.',
        mood: 'great' as const,
        followUp: 'Practice mindfulness exercise discussed. Review journal entries next session.',
        createdAt: twoDaysAgo.toISOString(),
      },
      ...state.sessions,
    ],
    invoices: [
      {
        id: invoiceId,
        clientId: SAMPLE_CLIENT_ID,
        amount: 150,
        description: 'Session on ' + fiveDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dueDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending' as const,
        createdAt: fiveDaysAgo.toISOString(),
        sessionIds: [sessionId1],
      },
      ...state.invoices,
    ],
  }));

  AsyncStorage.setItem(SAMPLE_DATA_LOADED_KEY, 'true');
}

/**
 * Check if a client is the sample client.
 */
export function isSampleClient(clientId: string): boolean {
  return clientId === SAMPLE_CLIENT_ID;
}

/**
 * Remove all sample data from the store.
 */
export function removeSampleData(): void {
  useAppStore.setState((state) => ({
    clients: state.clients.filter((c) => c.id !== SAMPLE_CLIENT_ID),
    sessions: state.sessions.filter((s) => s.clientId !== SAMPLE_CLIENT_ID),
    invoices: state.invoices.filter((i) => i.clientId !== SAMPLE_CLIENT_ID),
    appointments: state.appointments.filter((a) => a.clientId !== SAMPLE_CLIENT_ID),
  }));
  AsyncStorage.setItem(SAMPLE_DATA_REMOVED_KEY, 'true');
}

/**
 * Check if sample data exists in the store.
 */
export function hasSampleData(): boolean {
  return useAppStore.getState().clients.some((c) => c.id === SAMPLE_CLIENT_ID);
}
