import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import SalesHistory from "./pages/SalesHistory";
import StockAlerts from "./pages/StockAlerts";
import Reports from "./pages/Reports";
import StoreSettings from "./pages/StoreSettings";
import NotFound from "./pages/NotFound";
import CustomerProducts from "./pages/CustomerProducts";
import CustomerProductDetails from "./pages/CustomerProductDetails";
import CustomerCart from "./pages/CustomerCart";
import CustomerCheckout from "./pages/CustomerCheckout";
import CustomerReceipt from "./pages/CustomerReceipt";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerSignup from "./pages/CustomerSignup";
import CustomerHistory from "./pages/CustomerHistory";
import { StoreSettingsProvider } from "./contexts/StoreSettingsContext";
import { CustomerAuthProvider, useCustomerAuth } from "./contexts/CustomerAuthContext";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function CustomerProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useCustomerAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/shop/login" replace state={{ from: '/shop/history' }} />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
      <Route path="/sales-history" element={<ProtectedRoute><SalesHistory /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute adminOnly><StockAlerts /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute adminOnly><StoreSettings /></ProtectedRoute>} />
      <Route path="/shop/products" element={<CustomerProducts />} />
      <Route path="/shop/products/:id" element={<CustomerProductDetails />} />
      <Route path="/shop/cart" element={<CustomerCart />} />
      <Route path="/shop/login" element={<CustomerLogin />} />
      <Route path="/shop/signup" element={<CustomerSignup />} />
      <Route path="/shop/history" element={<CustomerProtectedRoute><CustomerHistory /></CustomerProtectedRoute>} />
      <Route path="/shop/checkout" element={<CustomerCheckout />} />
      <Route path="/shop/receipt/:receiptNumber" element={<CustomerReceipt />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <StoreSettingsProvider>
            <CustomerAuthProvider>
              <AppRoutes />
            </CustomerAuthProvider>
          </StoreSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
