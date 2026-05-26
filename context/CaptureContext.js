import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';

import {
  createCapture,
  fetchDueRevisions,
  fetchRevisionStats,
  fetchBackendHealth,
  fetchCaptures,
  fetchPreflight,
  submitCaptureReview,
} from '../services/backendApi';

const CaptureContext = createContext(undefined);

export const CaptureProvider = ({children}) => {
  const [captures, setCaptures] = useState([]);
  const [captureFilters, setCaptureFilters] = useState({
    tag: '',
    formalite: '',
  });
  const captureFiltersRef = useRef(captureFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshingRevisions, setIsRefreshingRevisions] = useState(false);
  const [error, setError] = useState('');
  const [revisionStats, setRevisionStats] = useState({
    totalCaptures: 0,
    totalReviewedPhrases: 0,
    totalDueRevisions: 0,
    totalScheduledRevisions: 0,
    topTags: [],
    languageBreakdown: [],
    formalityBreakdown: [],
  });
  const [dueRevisions, setDueRevisions] = useState([]);
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

  useEffect(() => {
    captureFiltersRef.current = captureFilters;
  }, [captureFilters]);

  const refreshCaptures = useCallback(async filtersOverride => {
    setIsLoading(true);
    setError('');

    try {
      const nextCaptures = await fetchCaptures(filtersOverride || captureFiltersRef.current);
      setCaptures(nextCaptures);
      return nextCaptures;
    } catch (refreshError) {
      setError(refreshError.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshRevisionData = useCallback(async () => {
    setIsRefreshingRevisions(true);
    setError('');

    try {
      const [nextStats, nextDueRevisions] = await Promise.all([
        fetchRevisionStats(),
        fetchDueRevisions(),
      ]);
      setRevisionStats(nextStats);
      setDueRevisions(nextDueRevisions);
      return {stats: nextStats, dueRevisions: nextDueRevisions};
    } catch (refreshError) {
      setError(refreshError.message);
      return {
        stats: null,
        dueRevisions: [],
      };
    } finally {
      setIsRefreshingRevisions(false);
    }
  }, []);

  useEffect(() => {
    refreshCaptures();
    refreshBackendStatus();
    refreshRevisionData();
  }, [refreshBackendStatus, refreshCaptures, refreshRevisionData]);

  const uploadCapture = useCallback(async captureInput => {
    setIsSubmitting(true);
    setError('');

    try {
      const capture = await createCapture(captureInput);
      setCaptures(previous => [capture, ...previous]);
      await refreshBackendStatus();
      await refreshRevisionData();
      return capture;
    } catch (uploadError) {
      setError(uploadError.message);
      throw uploadError;
    } finally {
      setIsSubmitting(false);
    }
  }, [refreshBackendStatus, refreshRevisionData]);

  const applyCaptureFilters = useCallback(async nextFilters => {
    const normalizedFilters = {
      tag: nextFilters?.tag?.trim() || '',
      formalite: nextFilters?.formalite?.trim() || '',
    };
    setCaptureFilters(normalizedFilters);
    return refreshCaptures(normalizedFilters);
  }, [refreshCaptures]);

  const resetCaptureFilters = useCallback(async () => {
    const emptyFilters = {tag: '', formalite: ''};
    setCaptureFilters(emptyFilters);
    return refreshCaptures(emptyFilters);
  }, [refreshCaptures]);

  const reviewCapture = useCallback(async (captureId, quality) => {
    setIsSubmitting(true);
    setError('');

    try {
      const updatedCapture = await submitCaptureReview(captureId, quality);
      setCaptures(previous =>
        previous.map(capture => (capture.id === captureId ? updatedCapture : capture)),
      );
      setDueRevisions(previous =>
        previous.filter(capture => capture.id !== captureId),
      );
      await refreshRevisionData();
      return updatedCapture;
    } catch (reviewError) {
      setError(reviewError.message);
      throw reviewError;
    } finally {
      setIsSubmitting(false);
    }
  }, [refreshRevisionData]);

  const value = useMemo(
    () => ({
      captures,
      captureFilters,
      dueRevisions,
      isLoading,
      isSubmitting,
      isRefreshingRevisions,
      error,
      backendStatus,
      revisionStats,
      refreshBackendStatus,
      refreshCaptures,
      refreshRevisionData,
      applyCaptureFilters,
      resetCaptureFilters,
      reviewCapture,
      uploadCapture,
    }),
    [
      applyCaptureFilters,
      backendStatus,
      captureFilters,
      captures,
      dueRevisions,
      error,
      isLoading,
      isSubmitting,
      isRefreshingRevisions,
      refreshRevisionData,
      resetCaptureFilters,
      refreshBackendStatus,
      refreshCaptures,
      reviewCapture,
      revisionStats,
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
