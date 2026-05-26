import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, NavLink } from 'react-router-dom';
import { useMe } from '@/hooks/useMe';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  TicketPercent,
  Store,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/produtos', label: 'Produtos', icon: Package },
  { to: '/admin/categorias', label: 'Categorias', icon: FolderTree },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { to: '/admin/usuarios', label: 'Usuários', icon: Users },
  { to: '/admin/cupons', label: 'Cupons', icon: TicketPercent },
];

export function AdminLayout() {
  const token = useAuthStore((s) => s.accessToken);
  const { data: me, isLoading } = useMe();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  if (!token) return <Navigate to="/login" replace />;
  if (!isLoading && me?.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Acesso restrito</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Você não tem permissão de administrador.</p>
        <Link to="/" className="mt-6 inline-block text-sm font-semibold text-fuchsia-600 underline dark:text-fuchsia-400">
          Voltar à loja
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 md:flex-row">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-950 md:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            className="shrink-0 rounded-lg p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => setMobileNavOpen(true)}
            aria-expanded={mobileNavOpen}
            aria-controls="admin-mobile-nav"
            aria-label="Abrir menu do painel"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="truncate font-display text-sm font-bold text-slate-900 dark:text-white">Painel admin</p>
        </div>
        <Link
          to="/"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1.5 text-xs font-semibold text-fuchsia-800 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/40 dark:text-fuchsia-200"
        >
          <Store className="h-3.5 w-3.5" />
          Ver loja
        </Link>
      </header>

      {mobileNavOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            aria-label="Fechar menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <nav
            id="admin-mobile-nav"
            className="fixed left-0 top-0 z-50 flex h-full w-[min(18rem,88vw)] flex-col border-r border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950 md:hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-3 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wide text-fuchsia-600">Menu</span>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <Link
                to="/"
                className="mb-3 flex items-center gap-2 rounded-xl border border-fuchsia-100 bg-fuchsia-50/80 px-3 py-2.5 text-sm font-semibold text-fuchsia-900 dark:border-fuchsia-900/40 dark:bg-fuchsia-950/30 dark:text-fuchsia-100"
                onClick={() => setMobileNavOpen(false)}
              >
                <Store className="h-4 w-4 shrink-0" />
                Ver loja como cliente
              </Link>
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-fuchsia-600">Painel</p>
              <div className="mt-2 space-y-1">
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-900',
                        isActive && 'bg-fuchsia-50 text-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-200'
                      )
                    }
                  >
                    <l.icon className="h-4 w-4 shrink-0" />
                    {l.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </nav>
        </>
      )}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 md:block">
        <Link
          to="/"
          className="mb-4 flex items-center gap-2 rounded-xl border border-fuchsia-100 bg-fuchsia-50/80 px-3 py-2.5 text-sm font-semibold text-fuchsia-900 hover:bg-fuchsia-100 dark:border-fuchsia-900/40 dark:bg-fuchsia-950/30 dark:text-fuchsia-100 dark:hover:bg-fuchsia-950/50"
        >
          <Store className="h-4 w-4 shrink-0" />
          Ver loja como cliente
        </Link>
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-fuchsia-600">Painel</p>
        <nav className="mt-4 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-900',
                  isActive && 'bg-fuchsia-50 text-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-200'
                )
              }
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1 overflow-x-auto p-4 md:p-8">
        <Outlet />
      </div>
    </div>
  );
}
