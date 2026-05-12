import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';

import {
  createCapture,
  fetchBackendHealth,
  fetchCaptures,
  fetchPreflight,
} from '../services/backendApi';

const CaptureContext = createContext(undefined);

export const CaptureProvider = ({children}) => {
  const [captures, setCaptures] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState({
    health: {
      status: 'indisponible',
      message: 'Backend non contacte.',
      version: null,
    },
    preflight: {
      status: 'indisponible',
      message: 'Verification preflight non lancee.',
      checks: [],
    },
    isReady: false,
  });

  const refreshBackendStatus = useCallback(async () => {
    try {
      const [health, preflight] = await Promise.all([
        fetchBackendHealth(),
        fetchPreflight(),
      ]);
      const isReady =
        health.status !== 'indisponible' && preflight.status !== 'degraded';

      const nextStatus = {
        health,
        preflight,
        isReady,
      };

      setBackendStatus(nextStatus);
      return nextStatus;
    } catch (statusError) {
      const nextStatus = {
        health: {
          status: 'indisponible',
          message: statusError.message,
          version: null,
        },
        preflight: {
          status: 'indisponible',
          message: 'Verification preflight indisponible.',
          checks: [],
        },
        isReady: false,
      };

      setBackendStatus(nextStatus);
      setError(statusError.message);
      return nextStatus;
    }
  }, []);

  const refreshCaptures = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const nextCaptures = await fetchCaptures();
      setCaptures(nextCaptures);
      return nextCaptures;
    } catch (refreshError) {
      setError(refreshError.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCaptures();
    refreshBackendStatus();
  }, [refreshBackendStatus, refreshCaptures]);

  const uploadCapture = useCallback(async captureInput => {
    setIsSubmitting(true);
    setError('');

    try {
      const capture = await createCapture(captureInput);
      setCaptures(previous => [capture, ...previous]);
      await refreshBackendStatus();
      return capture;
    } catch (uploadError) {
      setError(uploadError.message);
      throw uploadError;
    } finally {
      setIsSubmitting(false);
    }
  }, [refreshBackendStatus]);

  const value = useMemo(
    () => ({
      captures,
      isLoading,
      isSubmitting,
      error,
      backendStatus,
      refreshBackendStatus,
      refreshCaptures,
      uploadCapture,
    }),
    [
      backendStatus,
      captures,
      error,
      isLoading,
      isSubmitting,
      refreshBackendStatus,
      refreshCaptures,
      uploadCapture,
    ],
  );

  return (
    <CaptureContext.Provider value={value}>
      {children}
    </CaptureContext.Provider>
  );
};

export const useCaptures = () => {
  const context = useContext(CaptureContext);
  if (!context) {
    throw new Error('useCaptures must be used inside CaptureProvider.');
  }
  return context;
};
