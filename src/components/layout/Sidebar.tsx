import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  History,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, adminOnly: false },
  { name: 'Products', href: '/products', icon: Package, adminOnly: false },
  { name: 'Sales / POS', href: '/sales', icon: ShoppingCart, adminOnly: false },
  { name: 'Sales History', href: '/sales-history', icon: History, adminOnly: false },
  { name: 'Suppliers', href: '/suppliers', icon: Users, adminOnly: true },
  { name: 'Stock Alerts', href: '/alerts', icon: AlertTriangle, adminOnly: true },
  { name: 'Reports', href: '/reports', icon: BarChart3, adminOnly: true },
  { name: 'Store Settings', href: '/settings', icon: Settings, adminOnly: true },
];

export function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNavItems = navigationItems.filter(
    item => !item.adminOnly || isAdmin
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 flex flex-col',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
            <Smartphone className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold text-sidebar-foreground">PhoneStore</h1>
              <p className="text-xs text-sidebar-muted">Inventory Manager</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'nav-link',
                isActive && 'active',
                collapsed && 'justify-center px-3'
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="animate-fade-in">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-4">
        {!collapsed && (
          <div className="mb-3 animate-fade-in">
            <p className="text-sm font-medium text-sidebar-foreground">{user?.username}</p>
            <p className="text-xs text-sidebar-muted capitalize">
              {user?.role.replace('_', ' ').toLowerCase()}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
            collapsed && 'justify-center px-3'
          )}
          onClick={logout}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && 'Logout'}
        </Button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-md hover:bg-muted transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-foreground" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-foreground" />
        )}
      </button>
    </aside>
  );
}
