import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  LayoutDashboard,
  Package,
  ShoppingCart,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';

const serviceItems = [
  {
    title: 'Smart Dashboard',
    description: 'Monitor inventory value, stock health, and sales performance in one place.',
    icon: LayoutDashboard,
  },
  {
    title: 'Product Management',
    description: 'Add, update, and track phones and accessories with cost and selling prices.',
    icon: Package,
  },
  {
    title: 'Sales & POS',
    description: 'Process sales quickly and maintain clean transaction records.',
    icon: ShoppingCart,
  },
  {
    title: 'Stock Alerts',
    description: 'Get notified early for low stock and out-of-stock items.',
    icon: AlertTriangle,
  },
  {
    title: 'Reports',
    description: 'Review sales and inventory trends for better decisions.',
    icon: BarChart3,
  },
  {
    title: 'Role Access',
    description: 'Separate responsibilities for admin and staff users.',
    icon: ShieldCheck,
  },
];

const IndexPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)',
        backgroundSize: '40px 40px',
      }} />

      <main className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <section className="rounded-2xl border bg-card p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                  <Smartphone className="h-6 w-6 text-primary-foreground" />
                </div>
                <Badge variant="secondary">Phone Store Inventory System</Badge>
              </div>
              <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
                Manage Your Phone Store with Confidence
              </h1>
              <p className="max-w-2xl text-muted-foreground">
                Explore inventory, sales, stock alerts, and reporting tools built for daily store operations.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:min-w-56">
              <Button asChild className="btn-gradient w-full">
                <Link to="/login">Login as Admin / Staff</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/shop/products">Explore Customer Products</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-foreground">System Services</h2>
            <p className="text-sm text-muted-foreground">Core features available in the platform.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {serviceItems.map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <item.icon className="h-5 w-5 text-primary" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default IndexPage;
