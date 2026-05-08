import { Link } from 'react-router-dom';
import { Smartphone, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

interface CustomerLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  cartCount?: number;
}

export function CustomerLayout({ children, title, subtitle, cartCount = 0 }: CustomerLayoutProps) {
  const { isAuthenticated, user, logout } = useCustomerAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/shop/products" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Smartphone className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">PhoneStore</p>
              <p className="text-xs text-muted-foreground">Customer Shop</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/shop/cart" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Cart ({cartCount})
              </Link>
            </Button>
            {isAuthenticated ? (
              <>
                <Button asChild variant="outline">
                  <Link to="/shop/history">History</Link>
                </Button>
                <Button variant="outline" onClick={() => void logout()}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link to="/shop/login">Login</Link>
                </Button>
                <Button asChild className="btn-gradient">
                  <Link to="/shop/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          {isAuthenticated && user ? (
            <p className="mt-1 text-xs text-muted-foreground">Signed in as {user.full_name}</p>
          ) : null}
        </div>
        {children}
      </main>
    </div>
  );
}
