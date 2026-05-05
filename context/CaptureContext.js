import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';

import {createCapture, fetchCaptures} from '../services/backendApi';

const CaptureContext = createContext(undefined);

export const CaptureProvider = ({children}) => {
  const [captures, setCaptures] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
  }, [refreshCaptures]);

  const uploadCapture = useCallback(async captureInput => {
    setIsSubmitting(true);
    setError('');

    try {
      const capture = await createCapture(captureInput);
      setCaptures(previous => [capture, ...previous]);
      return capture;
    } catch (uploadError) {
      setError(uploadError.message);
      throw uploadError;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      captures,
      isLoading,
      isSubmitting,
      error,
      refreshCaptures,
      uploadCapture,
    }),
    [captures, error, isLoading, isSubmitting, refreshCaptures, uploadCapture],
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
