import { useCallback, useEffect, useState } from 'react';
import { hasEntitlement, getCustomerInfo, isRevenueCatEnabled } from '@/lib/revenuecatClient';

export interface SubscriptionState {
  isPro: boolean;
  isLoading: boolean;
  checkSubscription: () => Promise<void>;
}

/**
 * Hook to manage Pro subscription status
 *
 * @example
 * const { isPro, isLoading, checkSubscription } = useSubscription();
 *
 * // Check if user has Pro access
 * if (isPro) {
 *   // Show Pro features
 * }
 *
 * // Refresh subscription status after purchase
 * await checkSubscription();
 */
export function useSubscription(): SubscriptionState {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!isRevenueCatEnabled()) {
      setIsPro(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const result = await hasEntitlement('pro');

    if (result.ok) {
      setIsPro(result.data);
    } else {
      setIsPro(false);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  return {
    isPro,
    isLoading,
    checkSubscription,
  };
}
