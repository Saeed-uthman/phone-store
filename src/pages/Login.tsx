import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Loader2, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AuthMode = 'login' | 'signup' | 'forgot-password';

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      await login({ username, password });
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: This calls the mock API - will be connected to Django backend later
      // Django endpoint: POST /api/auth/signup/
      await authApi.signup({ username, email, password });
      
      toast({
        title: 'Account Created!',
        description: 'Your account has been created. Please log in.',
      });
      setMode('login');
      resetForm();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Signup Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: This calls the mock API - will be connected to Django backend later
      // Django endpoint: POST /api/auth/forgot-password/
      const response = await authApi.forgotPassword(email);
      
      setSuccessMessage(response.message || 'Password reset instructions have been sent to your email.');
      toast({
        title: 'Email Sent!',
        description: 'Check your inbox for password reset instructions.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Request Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive animate-slide-up">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input-focus"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <button
            type="button"
            onClick={() => { setMode('forgot-password'); resetForm(); }}
            className="text-sm text-primary hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-focus"
          disabled={isLoading}
        />
      </div>

      <Button
        type="submit"
        className="w-full btn-gradient"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => { setMode('signup'); resetForm(); }}
          className="text-primary font-medium hover:underline"
        >
          Sign up
        </button>
      </div>

    </form>
  );

  const renderSignupForm = () => (
    <form onSubmit={handleSignup} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive animate-slide-up">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="signup-username">Username</Label>
        <Input
          id="signup-username"
          type="text"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input-focus"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-focus"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-focus"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input-focus"
          disabled={isLoading}
        />
      </div>

      <Button
        type="submit"
        className="w-full btn-gradient"
        disabled={isLoading || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => { setMode('login'); resetForm(); }}
          className="text-primary font-medium hover:underline"
        >
          Sign in
        </button>
      </div>
    </form>
  );

  const renderForgotPasswordForm = () => (
    <form onSubmit={handleForgotPassword} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive animate-slide-up">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-sm text-green-600 animate-slide-up">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Enter your email address and we'll send you instructions to reset your password.
      </p>

      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-focus"
          disabled={isLoading}
        />
      </div>

      <Button
        type="submit"
        className="w-full btn-gradient"
        disabled={isLoading || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          'Send Reset Instructions'
        )}
      </Button>

      <button
        type="button"
        onClick={() => { setMode('login'); resetForm(); }}
        className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </button>
    </form>
  );

  const getTitle = () => {
    switch (mode) {
      case 'signup':
        return 'Create Account';
      case 'forgot-password':
        return 'Reset Password';
      default:
        return 'Welcome Back';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'signup':
        return 'Sign up to access the inventory system';
      case 'forgot-password':
        return 'Recover access to your account';
      default:
        return 'Sign in to your account';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center">
        <Card className="w-full overflow-hidden shadow-card animate-fade-in">
          <div className="grid md:grid-cols-2">
            <div className="relative hidden md:flex">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent" />
              <img
                src="/placeholder.svg"
                alt="Phone inventory system preview"
                className="absolute inset-0 h-full w-full object-cover opacity-20"
              />
              <div className="relative z-10 flex h-full flex-col justify-between p-8 text-primary-foreground">
                <div>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/20">
                    <Smartphone className="h-8 w-8" />
                  </div>
                  <h2 className="text-3xl font-bold">PhoneStore IMS</h2>
                  <p className="mt-3 text-sm leading-relaxed text-primary-foreground/90">
                    Manage stock, track sales, monitor low inventory alerts, and keep your store operations organized.
                  </p>
                </div>
                <div className="space-y-2 text-sm text-primary-foreground/90">
                  <p>- Inventory and pricing control</p>
                  <p>- Fast sales processing</p>
                  <p>- Admin and staff role access</p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-8">
              <CardHeader className="px-0 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary md:hidden">
                  <Smartphone className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold">{getTitle()}</CardTitle>
                <CardDescription>{getDescription()}</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                {mode === 'login' && renderLoginForm()}
                {mode === 'signup' && renderSignupForm()}
                {mode === 'forgot-password' && renderForgotPasswordForm()}
              </CardContent>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
