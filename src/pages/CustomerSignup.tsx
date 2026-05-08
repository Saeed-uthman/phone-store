import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

export default function CustomerSignupPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signup, isLoading } = useCustomerAuth();

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!form.full_name.trim() || !form.phone.trim() || !form.email.trim() || !form.password) {
      setError('Please complete all fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await signup({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast({ title: 'Account created', description: 'Your customer account is ready.' });
      navigate('/shop/history', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create account.';
      setError(message);
      toast({ title: 'Signup failed', description: message, variant: 'destructive' });
    }
  };

  return (
    <CustomerLayout title="Create Customer Account" subtitle="Sign up to access purchase history and receipts">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Signup</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="customer-full-name">Full Name</Label>
              <Input
                id="customer-full-name"
                value={form.full_name}
                onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone Number</Label>
              <Input
                id="customer-phone"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="Enter your phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-signup-email">Email</Label>
              <Input
                id="customer-signup-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-signup-password">Password</Label>
              <Input
                id="customer-signup-password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Create password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-signup-confirm-password">Confirm Password</Label>
              <Input
                id="customer-signup-confirm-password"
                type="password"
                value={form.confirmPassword}
                onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                placeholder="Confirm password"
              />
            </div>
            <Button type="submit" className="w-full btn-gradient" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already registered?{' '}
              <Link to="/shop/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </CustomerLayout>
  );
}
