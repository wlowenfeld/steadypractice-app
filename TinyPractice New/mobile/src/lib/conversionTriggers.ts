import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Share } from 'react-native';
import * as StoreReview from 'expo-store-review';

const LAST_REVIEW_PROMPT_KEY = 'lastReviewPromptDate';
const SHARE_PROMPT_SHOWN_KEY = 'share_prompt_10_shown';
const FIRST_INVOICE_CELEBRATION_SHOWN_KEY = 'first_invoice_celebration_shown';
const MIN_DAYS_BETWEEN_PROMPTS = 120;

/**
 * Priority system for conversion triggers:
 * paywall > review > share > celebration
 *
 * Only one prompt at a time. These helpers check eligibility
 * and return whether the prompt was shown, so callers can
 * skip lower-priority prompts.
 */

/**
 * Check if a review prompt was recently shown (within 120 days).
 */
export async function wasReviewRecentlyShown(): Promise<boolean> {
  const lastPromptStr = await AsyncStorage.getItem(LAST_REVIEW_PROMPT_KEY);
  if (!lastPromptStr) return false;
  const lastPrompt = new Date(lastPromptStr);
  const daysSinceLastPrompt = (Date.now() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceLastPrompt < MIN_DAYS_BETWEEN_PROMPTS;
}

/**
 * Request an in-app review if conditions are met.
 * Returns true if the review was requested.
 */
export async function maybeRequestReview({
  sessionCount,
  invoiceCount,
  isDemoMode,
}: {
  sessionCount: number;
  invoiceCount: number;
  isDemoMode: boolean;
}): Promise<boolean> {
  if (isDemoMode) return false;
  if (sessionCount < 5 && invoiceCount < 1) return false;
  if (Platform.OS === 'web') return false;

  const isAvailable = await StoreReview.isAvailableAsync();
  if (!isAvailable) return false;

  const recentlyShown = await wasReviewRecentlyShown();
  if (recentlyShown) return false;

  await AsyncStorage.setItem(LAST_REVIEW_PROMPT_KEY, new Date().toISOString());
  await StoreReview.requestReview();
  return true;
}

/**
 * Check if the 10th-session share prompt has already been shown.
 */
export async function hasSharePromptBeenShown(): Promise<boolean> {
  const shown = await AsyncStorage.getItem(SHARE_PROMPT_SHOWN_KEY);
  return shown === 'true';
}

/**
 * Mark the share prompt as shown.
 */
export async function markSharePromptShown(): Promise<void> {
  await AsyncStorage.setItem(SHARE_PROMPT_SHOWN_KEY, 'true');
}

/**
 * Check if the first-invoice celebration has already been shown.
 */
export async function hasInvoiceCelebrationBeenShown(): Promise<boolean> {
  const shown = await AsyncStorage.getItem(FIRST_INVOICE_CELEBRATION_SHOWN_KEY);
  return shown === 'true';
}

/**
 * Mark the first-invoice celebration as shown.
 */
export async function markInvoiceCelebrationShown(): Promise<void> {
  await AsyncStorage.setItem(FIRST_INVOICE_CELEBRATION_SHOWN_KEY, 'true');
}

/**
 * Open the share sheet with the TinyPractice referral message.
 */
export async function shareApp(): Promise<void> {
  try {
    await Share.share({
      message: `I run my therapy practice on TinyPractice — session notes, scheduling, invoices, all local to my phone. No $99/mo SimplePractice subscription. Free to try: https://apps.apple.com/app/id6758564968`,
    });
  } catch {
    // User cancelled
  }
}
