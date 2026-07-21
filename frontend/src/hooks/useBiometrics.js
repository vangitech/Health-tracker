import { useCallback, useEffect, useState } from 'react';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

export function useBiometrics() {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const { isAvailable } = await NativeBiometric.isAvailable();
      setBiometricAvailable(isAvailable);
      if (isAvailable) {
        try {
          const credentials = await NativeBiometric.getCredentials();
          setBiometricsEnabled(!!credentials?.email);
        } catch {
          setBiometricsEnabled(false);
        }
      } else {
        setBiometricsEnabled(false);
      }
    } catch {
      setBiometricAvailable(false);
      setBiometricsEnabled(false);
    }
    setLoading(false);
  };

  const authenticate = useCallback(async () => {
    try {
      return await NativeBiometric.authenticate({
        reason: 'Authenticate to access your account',
        title: 'Biometric Login',
        subtitle: 'Use your fingerprint or face to log in',
      });
    } catch {
      return null;
    }
  }, []);

  const saveCredentials = useCallback(async (email, password) => {
    try {
      await NativeBiometric.setCredentials({ email, password });
      setBiometricsEnabled(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const getCredentials = useCallback(async () => {
    try {
      return await NativeBiometric.getCredentials();
    } catch {
      return null;
    }
  }, []);

  const deleteCredentials = useCallback(async () => {
    try {
      await NativeBiometric.deleteCredentials();
      setBiometricsEnabled(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    biometricAvailable,
    biometricsEnabled,
    loading,
    authenticate,
    saveCredentials,
    getCredentials,
    deleteCredentials,
    checkBiometricStatus,
  };
}
