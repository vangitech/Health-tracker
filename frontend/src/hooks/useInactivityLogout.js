import { useEffect, useRef, useCallback } from 'react';

const DEFAULT_TIMEOUT = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'wheel'];

export function useInactivityLogout(onTimeout, timeout = DEFAULT_TIMEOUT, active = true) {
  const timerRef = useRef(null);
  const onTimeoutRef = useRef(onTimeout);
  const throttledRef = useRef(false);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clear();
    if (!active) return;
    timerRef.current = setTimeout(() => {
      onTimeoutRef.current?.();
    }, timeout);
  }, [active, timeout, clear]);

  useEffect(() => {
    if (!active) {
      clear();
      return;
    }

    reset();

    const handleActivity = () => {
      if (throttledRef.current) return;
      throttledRef.current = true;
      requestAnimationFrame(() => {
        throttledRef.current = false;
      });
      reset();
    };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handleActivity));
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handleActivity));
      clear();
    };
  }, [active, reset, clear]);
}
