import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current URL with all parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        // Check for error in URL
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error('Auth callback error:', error, errorDescription);
          setStatus('error');
          setErrorMessage(errorDescription || error);
          return;
        }

        // Exchange code for session
        const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (sessionError) {
          console.error('Error exchanging code for session:', sessionError);
          setStatus('error');
          setErrorMessage(sessionError.message);
          return;
        }

        if (data?.session) {
          console.log('✅ Authentication successful');
          setStatus('success');
          
          // Redirect to dashboard after short delay
          setTimeout(() => {
            setLocation('/dashboard');
          }, 1500);
        } else {
          setStatus('error');
          setErrorMessage('No session data received');
        }
      } catch (err: any) {
        console.error('Exception during auth callback:', err);
        setStatus('error');
        setErrorMessage(err.message || 'An unexpected error occurred');
      }
    };

    handleCallback();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Completing sign in...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Authentication failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground text-center">
                Please wait while we complete your sign in...
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-sm text-muted-foreground text-center">
                Authentication successful! Redirecting to dashboard...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-sm text-destructive text-center">
                {errorMessage}
              </p>
              <div className="flex gap-2 mt-4">
                <Link href="/login">
                  <Button variant="default">
                    Try Again
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline">
                    Go Home
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

