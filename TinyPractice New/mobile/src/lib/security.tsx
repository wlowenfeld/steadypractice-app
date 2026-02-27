import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { useAppStore } from './store';

const PIN_KEY = 'app_pin_hash';
const HIPAA_ACCEPTED_KEY = 'hipaa_accepted';
const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';
const BUSINESS_NAME_KEY = 'business_name';
const PAYMENT_INSTRUCTIONS_KEY = 'payment_instructions';
const DEFAULT_SESSION_RATE_KEY = 'default_session_rate';
const PIN_ATTEMPTS_KEY = 'pin_attempts';
const PIN_LOCKED_UNTIL_KEY = 'pin_locked_until';
const AUTO_LOCK_TIMEOUT = 60000; // 1 minute
const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

interface SecurityContextType {
  isLocked: boolean;
  isPinSet: boolean;
  isHipaaAccepted: boolean;
  isOnboardingCompleted: boolean;
  businessName: string;
  paymentInstructions: string;
  defaultSessionRate: number | null;
  isLoading: boolean;
  pinAttempts: number;
  pinLockedUntil: number | null;
  requiresPinReentry: boolean;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  unlock: () => void;
  lock: () => void;
  acceptHipaa: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  setBusinessName: (name: string) => Promise<void>;
  setPaymentInstructions: (instructions: string) => Promise<void>;
  setDefaultSessionRate: (rate: number | null) => Promise<void>;
  fullReset: () => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

// Keep for migration only
const legacyHashPin = (pin: string): string => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36) + pin.length.toString();
};

const hashPin = async (pin: string): Promise<string> => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin + 'steadypractice-salt-2026'
  );
};

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(true);
  const [isPinSet, setIsPinSet] = useState(false);
  const [isHipaaAccepted, setIsHipaaAccepted] = useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [businessName, setBusinessNameState] = useState('');
  const [paymentInstructions, setPaymentInstructionsState] = useState('');
  const [defaultSessionRate, setDefaultSessionRateState] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [pinLockedUntil, setPinLockedUntil] = useState<number | null>(null);
  const [requiresPinReentry, setRequiresPinReentry] = useState(false);
  const lastActiveTime = useRef(Date.now());
  const appState = useRef(AppState.currentState);

  // Check security status on mount
  useEffect(() => {
    const checkSecurityStatus = async () => {
      try {
        const [pinHash, hipaaAccepted, onboardingCompleted, savedBusinessName, savedPaymentInstructions, savedSessionRate, savedAttempts, savedLockedUntil] = await Promise.all([
          SecureStore.getItemAsync(PIN_KEY),
          AsyncStorage.getItem(HIPAA_ACCEPTED_KEY),
          AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY),
          AsyncStorage.getItem(BUSINESS_NAME_KEY),
          AsyncStorage.getItem(PAYMENT_INSTRUCTIONS_KEY),
          AsyncStorage.getItem(DEFAULT_SESSION_RATE_KEY),
          SecureStore.getItemAsync(PIN_ATTEMPTS_KEY),
          SecureStore.getItemAsync(PIN_LOCKED_UNTIL_KEY),
        ]);

        setIsPinSet(!!pinHash);
        setIsHipaaAccepted(hipaaAccepted === 'true');
        setIsOnboardingCompleted(onboardingCompleted === 'true');
        setBusinessNameState(savedBusinessName || '');
        setPaymentInstructionsState(savedPaymentInstructions || '');
        setDefaultSessionRateState(savedSessionRate ? parseFloat(savedSessionRate) : null);

        // Detect legacy PIN hash: SHA-256 hex digests are exactly 64 hex chars
        if (pinHash && !/^[0-9a-f]{64}$/.test(pinHash)) {
          setRequiresPinReentry(true);
        }

        // Restore PIN attempt state
        if (savedAttempts) setPinAttempts(parseInt(savedAttempts, 10) || 0);
        if (savedLockedUntil) {
          const lockedUntil = parseInt(savedLockedUntil, 10);
          if (lockedUntil > Date.now()) {
            setPinLockedUntil(lockedUntil);
          } else {
            // Lockout expired, clear it
            await SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY);
            await SecureStore.deleteItemAsync(PIN_LOCKED_UNTIL_KEY);
          }
        }

        // If no PIN is set, don't lock the app (first time user)
        if (!pinHash) {
          setIsLocked(false);
        }
      } catch (error) {
        console.error('Error checking security status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSecurityStatus();
  }, []);

  // Handle app state changes for auto-lock
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App going to background, record time
        lastActiveTime.current = Date.now();
      } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App coming to foreground, check if we should lock
        const timeSinceActive = Date.now() - lastActiveTime.current;
        if (timeSinceActive > AUTO_LOCK_TIMEOUT && isPinSet) {
          setIsLocked(true);
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isPinSet]);

  const setPin = useCallback(async (pin: string) => {
    const hash = await hashPin(pin);
    await SecureStore.setItemAsync(PIN_KEY, hash);
    setIsPinSet(true);
    setIsLocked(false);
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    // Check lockout
    if (pinLockedUntil && Date.now() < pinLockedUntil) {
      return false;
    }

    const storedHash = await SecureStore.getItemAsync(PIN_KEY);
    if (!storedHash) return false;

    const newHash = await hashPin(pin);
    let isValid = newHash === storedHash;

    // Migration: check legacy hash
    if (!isValid) {
      const legacy = legacyHashPin(pin);
      if (legacy === storedHash) {
        // Re-save with secure hash
        await SecureStore.setItemAsync(PIN_KEY, newHash);
        setRequiresPinReentry(false);
        isValid = true;
      }
    }

    if (isValid) {
      // Reset attempts on success
      setPinAttempts(0);
      setPinLockedUntil(null);
      await SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY);
      await SecureStore.deleteItemAsync(PIN_LOCKED_UNTIL_KEY);
      return true;
    }

    // Track failed attempt
    const newAttempts = pinAttempts + 1;
    setPinAttempts(newAttempts);
    await SecureStore.setItemAsync(PIN_ATTEMPTS_KEY, newAttempts.toString());

    if (newAttempts >= MAX_PIN_ATTEMPTS) {
      const lockUntil = Date.now() + PIN_LOCKOUT_DURATION;
      setPinLockedUntil(lockUntil);
      await SecureStore.setItemAsync(PIN_LOCKED_UNTIL_KEY, lockUntil.toString());
    }

    return false;
  }, [pinAttempts, pinLockedUntil]);

  const changePin = useCallback(async (oldPin: string, newPin: string): Promise<boolean> => {
    const isValid = await verifyPin(oldPin);
    if (!isValid) return false;
    await setPin(newPin);
    return true;
  }, [verifyPin, setPin]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    lastActiveTime.current = Date.now();
  }, []);

  const lock = useCallback(() => {
    if (isPinSet) {
      setIsLocked(true);
    }
  }, [isPinSet]);

  const acceptHipaa = useCallback(async () => {
    await AsyncStorage.setItem(HIPAA_ACCEPTED_KEY, 'true');
    setIsHipaaAccepted(true);
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setIsOnboardingCompleted(true);
  }, []);

  const resetOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'false');
    setIsOnboardingCompleted(false);
  }, []);

  const setBusinessName = useCallback(async (name: string) => {
    await AsyncStorage.setItem(BUSINESS_NAME_KEY, name);
    setBusinessNameState(name);
  }, []);

  const setPaymentInstructions = useCallback(async (instructions: string) => {
    await AsyncStorage.setItem(PAYMENT_INSTRUCTIONS_KEY, instructions);
    setPaymentInstructionsState(instructions);
  }, []);

  const setDefaultSessionRate = useCallback(async (rate: number | null) => {
    if (rate === null) {
      await AsyncStorage.removeItem(DEFAULT_SESSION_RATE_KEY);
    } else {
      await AsyncStorage.setItem(DEFAULT_SESSION_RATE_KEY, rate.toString());
    }
    setDefaultSessionRateState(rate);
  }, []);

  const fullReset = useCallback(async () => {
    // Clear all security-related storage
    await Promise.all([
      SecureStore.deleteItemAsync(PIN_KEY),
      SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY),
      SecureStore.deleteItemAsync(PIN_LOCKED_UNTIL_KEY),
      AsyncStorage.removeItem(HIPAA_ACCEPTED_KEY),
      AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY),
      AsyncStorage.removeItem(BUSINESS_NAME_KEY),
      AsyncStorage.removeItem(PAYMENT_INSTRUCTIONS_KEY),
      AsyncStorage.removeItem(DEFAULT_SESSION_RATE_KEY),
    ]);

    // Clear Zustand persisted store data
    await AsyncStorage.removeItem('session-notes-storage');
    useAppStore.setState({ clients: [], sessions: [], appointments: [], invoices: [] });

    // Reset all state
    setIsPinSet(false);
    setIsHipaaAccepted(false);
    setIsOnboardingCompleted(false);
    setBusinessNameState('');
    setPaymentInstructionsState('');
    setDefaultSessionRateState(null);
    setIsLocked(false);
  }, []);

  return (
    <SecurityContext.Provider
      value={{
        isLocked,
        isPinSet,
        isHipaaAccepted,
        isOnboardingCompleted,
        businessName,
        paymentInstructions,
        defaultSessionRate,
        isLoading,
        pinAttempts,
        pinLockedUntil,
        requiresPinReentry,
        setPin,
        verifyPin,
        changePin,
        unlock,
        lock,
        acceptHipaa,
        completeOnboarding,
        resetOnboarding,
        setBusinessName,
        setPaymentInstructions,
        setDefaultSessionRate,
        fullReset,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
