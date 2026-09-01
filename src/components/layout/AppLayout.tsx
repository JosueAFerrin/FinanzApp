'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Plus,
  Tags,
  Repeat,
  Settings,
  LogOut,
  Menu,
  X,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { signOut } from '@/actions/auth';

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/incomes', label: 'Ingresos', icon: TrendingUp },
  { href: '/expenses', label: 'Egresos', icon: TrendingDown },
  { href: '/reports', label: 'Reportes', icon: BarChart3 },
];

const secondaryNavItems = [
  { href: '/categories', label: 'Categorías', icon: Tags },
  { href: '/recurring', label: 'Recurrentes', icon: Repeat },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-dark-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-dark-200/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-dark-100">
            <Menu className="w-5 h-5 text-dark-700" />
          </button>
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary-600" />
            <span className="text-lg font-bold gradient-text">FinanzApp</span>
          </div>
          <div className="w-9" />
        </div>
      </header>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-slide-down">
            <SidebarContent
              pathname={pathname}
              isActive={isActive}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Sidebar (desktop) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col h-full bg-white border-r border-dark-100">
          <SidebarContent pathname={pathname} isActive={isActive} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-dark-200/50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around py-2 px-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  active
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-dark-400 hover:text-dark-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          <Link
            href="/expenses?new=true"
            className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-500/30 -mt-4 hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </Link>
        </div>
      </nav>
    </div>
  );
}

function SidebarContent({
  pathname,
  isActive,
  onClose,
}: {
  pathname: string;
  isActive: (href: string) => boolean;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-dark-900">FinanzApp</h1>
            <p className="text-xs text-dark-400">Control financiero</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 lg:hidden">
            <X className="w-5 h-5 text-dark-500" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1">
        <p className="px-3 py-2 text-xs font-semibold text-dark-400 uppercase tracking-wider">
          Principal
        </p>
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-dark-600 hover:bg-dark-50 hover:text-dark-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : ''}`} />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4">
          <p className="px-3 py-2 text-xs font-semibold text-dark-400 uppercase tracking-wider">
            Administrar
          </p>
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-dark-600 hover:bg-dark-50 hover:text-dark-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-3 border-t border-dark-100">
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-dark-500 hover:bg-danger-50 hover:text-danger-600 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
