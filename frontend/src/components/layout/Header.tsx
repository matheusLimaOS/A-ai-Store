import { Link, NavLink } from 'react-router-dom';
import { ShoppingBag, Moon, Sun, Menu, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore, computeCartTotals } from '@/stores/cartStore';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/cn';
import { useMe } from '@/hooks/useMe';

export function Header() {
  const { accessToken, logout } = useAuthStore();
  const { data: me } = useMe();
  const lines = useCartStore((s) => s.lines);
  const { subtotal } = computeCartTotals(lines);
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('imperio-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const t = localStorage.getItem('imperio-theme');
    if (t === 'dark') setDark(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-700 text-sm font-black text-white shadow-lg shadow-fuchsia-500/25">
              IA
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Império do Açaí
            </span>
          </Link>
        </div>

        <nav
          className={cn(
            'absolute left-0 right-0 top-full flex-col gap-1 border-b border-slate-200 bg-white p-4 text-sm font-medium dark:border-slate-800 dark:bg-slate-950 md:static md:flex md:flex-row md:border-0 md:bg-transparent md:p-0',
            open ? 'flex' : 'hidden md:flex'
          )}
        >
          <NavLink
            to="/cardapio"
            className={({ isActive }) =>
              cn(
                'rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900',
                isActive && 'text-fuchsia-600 dark:text-fuchsia-400'
              )
            }
            onClick={() => setOpen(false)}
          >
            Cardápio
          </NavLink>
          {!accessToken && (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900',
                    isActive && 'text-fuchsia-600 dark:text-fuchsia-400'
                  )
                }
                onClick={() => setOpen(false)}
              >
                Entrar
              </NavLink>
              <NavLink
                to="/cadastro"
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900',
                    isActive && 'text-fuchsia-600 dark:text-fuchsia-400'
                  )
                }
                onClick={() => setOpen(false)}
              >
                Criar conta
              </NavLink>
            </>
          )}
          {accessToken && (
            <>
              {me?.role === 'ADMIN' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900 md:hidden',
                      isActive && 'text-fuchsia-600 dark:text-fuchsia-400'
                    )
                  }
                  onClick={() => setOpen(false)}
                >
                  Painel admin
                </NavLink>
              )}
              <NavLink
                to="/pedidos"
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900',
                    isActive && 'text-fuchsia-600 dark:text-fuchsia-400'
                  )
                }
                onClick={() => setOpen(false)}
              >
                Meus pedidos
              </NavLink>
              <NavLink
                to="/perfil"
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900',
                    isActive && 'text-fuchsia-600 dark:text-fuchsia-400'
                  )
                }
                onClick={() => setOpen(false)}
              >
                Perfil
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setDark((d) => !d)}
            aria-label="Alternar tema"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {accessToken && me?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 sm:block dark:text-slate-300 dark:hover:bg-slate-800"
              title="Admin"
            >
              <LayoutDashboard className="h-5 w-5" />
            </Link>
          )}

          {accessToken ? (
            <button
              type="button"
              className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 sm:block dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => logout()}
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          ) : (
            <Link
              to="/login"
              className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 sm:block dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <User className="h-5 w-5" />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-700 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-600/30"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Carrinho</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {lines.length ? `R$ ${subtotal.toFixed(2)}` : '0'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
