import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AppLayout({ children, title, subtitle, actions }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}

      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-border bg-card px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold text-foreground">PhoneStore</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>
      )}

      {/* Main Content */}
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          !isMobile && 'ml-64',
          isMobile && 'pt-16'
        )}
      >
        {/* Page Header */}
        {(title || actions) && (
          <div className="border-b border-border bg-card px-6 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {title && (
                  <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                )}
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
