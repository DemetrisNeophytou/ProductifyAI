/**
 * Cloudflare Turnstile Integration
 * CAPTCHA-free challenge for form protection
 */

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement | string, options: TurnstileOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  tabindex?: number;
}

interface TurnstileProps {
  siteKey: string;
  onSuccess: (token: string) => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

/**
 * Turnstile Component
 * Renders Cloudflare Turnstile challenge
 */
export function Turnstile({
  siteKey,
  onSuccess,
  onError,
  theme = 'auto',
  size = 'normal',
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Turnstile script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if script already loaded
    if (window.turnstile) {
      setScriptLoaded(true);
      return;
    }

    // Load script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setScriptLoaded(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load Turnstile script');
      if (onError) onError();
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [onError]);

  // Render widget when script is loaded
  useEffect(() => {
    if (!scriptLoaded || !window.turnstile || !containerRef.current) return;

    const id = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: onSuccess,
      'error-callback': onError,
      'expired-callback': onError,
      theme,
      size,
    });

    setWidgetId(id);

    return () => {
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [scriptLoaded, siteKey, onSuccess, onError, theme, size]);

  // Show loading or error state if no siteKey
  if (!siteKey || siteKey.includes('your_') || siteKey.length < 10) {
    return (
      <div className="text-xs text-muted-foreground text-center py-2">
        CAPTCHA verification disabled in development
      </div>
    );
  }

  return <div ref={containerRef} className="flex justify-center my-4" />;
}

/**
 * Hook to use Turnstile programmatically
 */
export function useTurnstile(siteKey: string) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  const handleSuccess = (token: string) => {
    setToken(token);
    setError(false);
  };

  const handleError = () => {
    setToken(null);
    setError(true);
  };

  const reset = () => {
    setToken(null);
    setError(false);
  };

  return {
    token,
    error,
    reset,
    TurnstileComponent: () => (
      <Turnstile
        siteKey={siteKey}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    ),
  };
}

/**
 * Verify Turnstile token on backend
 */
export async function verifyTurnstileToken(
  token: string,
  secretKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data['error-codes']?.join(', ') || 'Verification failed',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Turnstile verification error:', error);
    return {
      success: false,
      error: error.message || 'Verification failed',
    };
  }
}

