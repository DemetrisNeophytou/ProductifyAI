import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { Github, Loader2, Eye, EyeOff } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured()) {
      setError("Authentication is not configured. Please contact support.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${import.meta.env.VITE_FRONTEND_URL || window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google OAuth error:', error);
        setError(error.message);
      }
    } catch (err: any) {
      console.error('Exception during Google OAuth:', err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    if (!isSupabaseConfigured()) {
      setError("Authentication is not configured. Please contact support.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${import.meta.env.VITE_FRONTEND_URL || window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('GitHub OAuth error:', error);
        setError(error.message);
      }
    } catch (err: any) {
      console.error('Exception during GitHub OAuth:', err);
      setError(err.message || 'Failed to sign in with GitHub');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!isSupabaseConfigured()) {
      setError("Authentication is not configured. Please contact support.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${import.meta.env.VITE_FRONTEND_URL || window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error('❌ signup_failed:', error.message);
        setError(error.message);
      } else if (data.user) {
        console.log('✅ signup_success:', data.user.email);
        // Redirect to dashboard after successful signup
        setLocation('/dashboard');
      }
    } catch (err: any) {
      console.error('Exception during signup:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (!isSupabaseConfigured()) {
      setError("Authentication is not configured. Please contact support.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ login_failed_reason:', error.message);
        setError(error.message);
      } else if (data.session) {
        console.log('✅ login_success:', data.user?.email);
        // Redirect to dashboard after successful login
        setLocation('/dashboard');
      }
    } catch (err: any) {
      console.error('Exception during login:', err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter your email address');
      return;
    }

    if (!isSupabaseConfigured()) {
      setError("Authentication is not configured. Please contact support.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${import.meta.env.VITE_FRONTEND_URL || window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        setError(error.message);
      } else {
        setError('Password reset email sent! Check your inbox.');
        setShowForgotPassword(false);
      }
    } catch (err: any) {
      console.error('Exception during password reset:', err);
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password view
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant={error.includes('sent') ? 'default' : 'destructive'}>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <Button 
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send reset link'
                )}
              </Button>
              <Button 
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForgotPassword(false);
                  setError(null);
                }}
                className="w-full"
              >
                Back to login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </CardTitle>
          <CardDescription>
            {mode === "login" 
              ? "Sign in to your account to continue" 
              : "Sign up to start creating with AI"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button 
              variant="outline" 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full hover-elevate active-elevate-2"
              data-testid="button-google-login"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <SiGoogle className="h-4 w-4 mr-2" />
              )}
              Continue with Google
            </Button>
            <Button 
              variant="outline" 
              onClick={handleGithubLogin}
              disabled={loading}
              className="w-full hover-elevate active-elevate-2"
              data-testid="button-github-login"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Github className="h-4 w-4 mr-2" />
              )}
              Continue with GitHub
            </Button>
          </div>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              Or continue with email
            </span>
          </div>

          <form onSubmit={mode === "signup" ? handleSignup : handleLogin} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "signup" ? "At least 6 characters" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            {mode === "login" && (
              <div className="text-right">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setShowForgotPassword(true)}
                  className="px-0 text-xs"
                >
                  Forgot password?
                </Button>
              </div>
            )}
            <Button 
              type="submit"
              disabled={loading}
              className="w-full" 
              data-testid="button-email-login"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "signup" ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                mode === "signup" ? "Create Account" : "Log In"
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <Link href="/signup">
                  <a className="text-primary hover:underline font-medium" data-testid="link-signup">
                    Sign up
                  </a>
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/login">
                  <a className="text-primary hover:underline font-medium" data-testid="link-login">
                    Sign in
                  </a>
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
