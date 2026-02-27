import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { hasEntitlement, getCustomerInfo, isRevenueCatEnabled } from '@/lib/revenuecatClient';

export interface SubscriptionState {
  isPro: boolean;
  isLoading: boolean;
  isConfigError: boolean;
  checkSubscription: () => Promise<void>;
}

/**
 * Hook to manage Pro subscription status
 *
 * @example
 * const { isPro, isLoading, isConfigError, checkSubscription } = useSubscription();
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
  const [isConfigError, setIsConfigError] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!isRevenueCatEnabled()) {
      // In production (non-dev, non-web), missing RC config is a problem
      const isProduction = !__DEV__ && Platform.OS !== 'web';
      if (isProduction) {
        console.warn('[useSubscription] RevenueCat not configured in production build — subscribers may lose access');
        setIsConfigError(true);
      }
      setIsPro(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsConfigError(false);

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
    isConfigError,
    checkSubscription,
  };
}
